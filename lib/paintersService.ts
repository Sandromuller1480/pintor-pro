import { supabase } from './supabase';
import { Painter } from '../types';

const STORAGE_BUCKETS = {
    workPhotos: 'application-work-photos',
    certifications: 'application-certifications'
} as const;

type ApplicationFormSubmission = {
    fullName: string,
    city: string,
    whatsapp: string,
    email: string,
    password?: string,
    experienceTime: string,
    specialty: string[],
    profilePhoto?: File,
    workPhotos: File[],
    certifications: File[]
};

type ApplicationProcessingRequest = {
    applicationId: string;
    applicant: Pick<ApplicationFormSubmission, 'fullName' | 'email' | 'city' | 'experienceTime'>;
    uploadedFiles: {
        workPhotoCount: number;
        certificationCount: number;
    };
    specialties: string[];
    specialtiesCount: number;
};

export type ApplicationProcessingResult = {
    ok: boolean;
    applicationId: string;
    status: 'accepted' | 'rejected';
    category: 'ouro' | 'prata' | 'bronze' | null;
    analysisNotes: string;
    emailSent: boolean;
    emailWarning: string | null;
    emailProviderId?: string | null;
};

export type ApplicationSubmissionResult = {
    id: string;
    work_photo_paths: string[];
    certification_paths: string[];
    processingResult: ApplicationProcessingResult | null;
    processingWarning: string | null;
};

export const paintersService = {
    async getAll() {
        const { data, error } = await supabase
            .from('painters')
            .select('*')
            .order('rating', { ascending: false });

        if (error) {
            console.error('Erro ao buscar pintores:', error);
            return [];
        }

        return data.map((item: any) => ({
            id: item.id,
            name: item.name,
            location: item.location,
            rating: item.rating,
            reviewsCount: item.reviews_count,
            description: item.description,
            verified: item.verified,
            topRated: item.top_rated,
            responseTime: item.response_time,
            avatar: item.avatar,
            banner: item.banner,
            specialties: item.specialties,
            coordinates: { lat: item.lat, lng: item.lng }
        })) as Painter[];
    },

    async getById(id: string) {
        const { data, error } = await supabase
            .from('painters')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Erro ao buscar pintor:', error);
            return null;
        }

        return {
            ...data,
            reviewsCount: data.reviews_count,
            topRated: data.top_rated,
            responseTime: data.response_time,
            coordinates: { lat: data.lat, lng: data.lng }
        } as Painter;
    },

    async submitApplication(formData: ApplicationFormSubmission): Promise<ApplicationSubmissionResult> {
        if (formData.password) {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: { full_name: formData.fullName }
                }
            });
            if (authError && authError.status !== 400) { 
                console.error('Erro de autenticação:', authError);
                throw new Error(`Erro ao criar acesso: ${authError.message}`);
            }
        }

        const { data, error } = await supabase
            .from('applications')
            .insert([{
                full_name: formData.fullName,
                city: formData.city,
                whatsapp: formData.whatsapp,
                email: formData.email,
                experience_time: formData.experienceTime,
                specialties: formData.specialty,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) {
            console.error('Erro ao inserir aplicacao:', error);
            throw new Error(`Falha ao salvar cadastro: ${error.message}`);
        }

        const [profilePhotoPaths, workPhotoPaths, certificationPaths] = await Promise.all([
            formData.profilePhoto ? this.uploadApplicationFiles(data.id, [formData.profilePhoto], STORAGE_BUCKETS.workPhotos, 'profile-photo') : Promise.resolve([]),
            this.uploadApplicationFiles(data.id, formData.workPhotos, STORAGE_BUCKETS.workPhotos, 'work-photos'),
            this.uploadApplicationFiles(data.id, formData.certifications, STORAGE_BUCKETS.certifications, 'certifications')
        ]);
        
        const finalWorkPhotos = [...profilePhotoPaths, ...workPhotoPaths];

        const { error: filesUpdateError } = await supabase
            .from('applications')
            .update({
                work_photo_paths: finalWorkPhotos,
                certification_paths: certificationPaths,
                work_photo_count: finalWorkPhotos.length,
                certification_count: certificationPaths.length
            })
            .eq('id', data.id);

        if (filesUpdateError) {
            console.error('Erro ao salvar caminhos dos arquivos da aplicacao:', filesUpdateError);
            throw new Error(`Falha ao atualizar anexos do cadastro: ${filesUpdateError.message}`);
        }

        let processingResult: ApplicationProcessingResult | null = null;
        let processingWarning: string | null = null;

        try {
            processingResult = await this.processAutomatedAnalysis({
                applicationId: data.id,
                applicant: {
                    fullName: formData.fullName,
                    email: formData.email,
                    city: formData.city,
                    experienceTime: formData.experienceTime
                },
                uploadedFiles: {
                    workPhotoCount: workPhotoPaths.length,
                    certificationCount: certificationPaths.length
                },
                specialties: formData.specialty,
                specialtiesCount: formData.specialty.length
            });
        } catch (processingError) {
            console.error('Erro no processamento da aplicacao:', processingError);
            processingWarning = processingError instanceof Error
                ? processingError.message
                : 'Falha ao concluir a analise automatica.';
        }

        return {
            id: data.id,
            work_photo_paths: finalWorkPhotos,
            certification_paths: certificationPaths,
            processingResult,
            processingWarning
        };
    },

    async uploadApplicationFiles(
        applicationId: string,
        files: File[],
        bucket: (typeof STORAGE_BUCKETS)[keyof typeof STORAGE_BUCKETS],
        folder: string
    ) {
        if (!files.length) return [];

        const uploadedPaths: string[] = [];

        for (const [index, file] of files.entries()) {
            const extension = file.name.split('.').pop()?.toLowerCase() ?? 'bin';
            const safeBaseName = file.name
                .replace(/\.[^/.]+$/, '')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[^a-zA-Z0-9-_]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '')
                .toLowerCase() || 'arquivo';

            const uniqueId = typeof crypto !== 'undefined' && 'randomUUID' in crypto
                ? crypto.randomUUID()
                : `${Date.now()}-${index}`;

            const filePath = `${applicationId}/${folder}/${uniqueId}-${safeBaseName}.${extension}`;

            const { error } = await supabase.storage
                .from(bucket)
                .upload(filePath, file, {
                    upsert: false,
                    contentType: file.type || undefined
                });

            if (error) {
                console.error(`Erro ao enviar arquivo para o bucket ${bucket}:`, error);
                throw new Error(`Falha no upload (${bucket}): ${error.message}`);
            }

            uploadedPaths.push(filePath);
        }

        return uploadedPaths;
    },

    async processAutomatedAnalysis(payload: ApplicationProcessingRequest): Promise<ApplicationProcessingResult> {
        const { data, error } = await supabase.functions.invoke('process-application', {
            body: payload
        });

        if (error) {
            console.error('Erro ao invocar funcao process-application:', error);
            throw error;
        }

        return data;
    }
};
