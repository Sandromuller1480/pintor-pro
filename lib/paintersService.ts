import { supabase } from './supabase';
import { Painter } from '../types';

const STORAGE_BUCKETS = {
    workPhotos: 'application-work-photos',
    certifications: 'application-certifications'
} as const;

const PUBLIC_PAINTER_DIRECTORY_VIEW = 'painter_directory_public';
const PUBLIC_PAINTER_MEDIA_BUCKET = 'painters-media';
const DEFAULT_PAINTER_AVATAR = 'https://i.pravatar.cc/200?u=pintor-pro';
const DEFAULT_PAINTER_BANNER = 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=1200&auto=format&fit=crop';
const LEGACY_PROFILE_PHOTO_EXPIRES_IN = 60 * 60;

const EXISTING_USER_ERROR_PATTERNS = [
    'already registered',
    'already been registered',
    'user already exists'
];

export type ApplicationFormSubmission = {
    fullName: string,
    gender?: '' | 'feminino' | 'masculino',
    cep: string,
    city: string,
    uf: string,
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

function isAbsoluteUrl(value: string | null | undefined) {
    return typeof value === 'string' && /^https?:\/\//i.test(value);
}

function getPublicPainterMediaUrl(path: string | null | undefined, fallback: string) {
    if (!path) {
        return fallback;
    }

    if (isAbsoluteUrl(path)) {
        return path;
    }

    const {
        data: { publicUrl }
    } = supabase.storage.from(PUBLIC_PAINTER_MEDIA_BUCKET).getPublicUrl(path);

    return publicUrl || fallback;
}

function isMissingPublicDirectoryError(error: { message?: string } | null) {
    const message = error?.message?.toLowerCase() ?? '';
    return message.includes('does not exist')
        || message.includes('schema cache')
        || message.includes('could not find the table');
}

function mapPainterRowToPainter(item: any): Painter {
    const isPublicDirectoryRow = 'portfolio_owner_id' in item || 'legacy_avatar_path' in item || 'experience_time' in item;

    return {
        id: item.id,
        applicationId: isPublicDirectoryRow ? item.id : undefined,
        name: item.name,
        location: item.location,
        rating: Number(item.rating ?? 0),
        reviewsCount: Number(item.reviews_count ?? 0),
        description: item.description || 'Perfil profissional ativo na PINTOR PRO.',
        verified: Boolean(item.verified),
        topRated: Boolean(item.top_rated),
        responseTime: item.response_time || 'sob consulta',
        avatar: getPublicPainterMediaUrl(item.avatar, DEFAULT_PAINTER_AVATAR),
        banner: getPublicPainterMediaUrl(item.banner, DEFAULT_PAINTER_BANNER),
        specialties: Array.isArray(item.specialties) ? item.specialties : [],
        experienceTime: item.experience_time ?? undefined,
        categoryLevel: item.category_level ?? undefined,
        subscriptionPlan: item.subscription_plan ?? undefined,
        portfolioOwnerId: item.portfolio_owner_id ?? item.auth_user_id ?? undefined,
        createdAt: item.created_at ?? undefined,
        coordinates: item.lat != null && item.lng != null
            ? { lat: item.lat, lng: item.lng }
            : undefined
    };
}

async function getLegacyProfilePhotoUrl(path: string | null | undefined) {
    if (!path) {
        return null;
    }

    if (isAbsoluteUrl(path)) {
        return path;
    }

    const { data, error } = await supabase.storage
        .from(STORAGE_BUCKETS.workPhotos)
        .createSignedUrl(path, LEGACY_PROFILE_PHOTO_EXPIRES_IN);

    if (error) {
        console.error('Erro ao gerar URL da foto de perfil legada:', error);
        return null;
    }

    return data.signedUrl;
}

async function enrichPainterRowWithMedia(item: any): Promise<Painter> {
    const painter = mapPainterRowToPainter(item);

    if (!item.avatar && item.legacy_avatar_path) {
        const legacyAvatarUrl = await getLegacyProfilePhotoUrl(item.legacy_avatar_path);

        if (legacyAvatarUrl) {
            painter.avatar = legacyAvatarUrl;
        }
    }

    return painter;
}

export const paintersService = {
    async getAll() {
        const publicDirectoryResult = await supabase
            .from(PUBLIC_PAINTER_DIRECTORY_VIEW)
            .select('*')
            .order('created_at', { ascending: false });

        if (!publicDirectoryResult.error && (publicDirectoryResult.data?.length ?? 0) > 0) {
            return Promise.all(publicDirectoryResult.data.map(enrichPainterRowWithMedia));
        }

        if (publicDirectoryResult.error && !isMissingPublicDirectoryError(publicDirectoryResult.error)) {
            console.error('Erro ao buscar diretorio publico de pintores:', publicDirectoryResult.error);
        }

        const { data, error } = await supabase
            .from('painters')
            .select('*')
            .order('rating', { ascending: false });

        if (error) {
            console.error('Erro ao buscar pintores:', error);
            return [];
        }

        return Promise.all(data.map(enrichPainterRowWithMedia));
    },

    async getById(id: string) {
        const publicDirectoryResult = await supabase
            .from(PUBLIC_PAINTER_DIRECTORY_VIEW)
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (!publicDirectoryResult.error && publicDirectoryResult.data) {
            return enrichPainterRowWithMedia(publicDirectoryResult.data);
        }

        if (publicDirectoryResult.error && !isMissingPublicDirectoryError(publicDirectoryResult.error)) {
            console.error('Erro ao buscar pintor no diretorio publico:', publicDirectoryResult.error);
        }

        const { data, error } = await supabase
            .from('painters')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('Erro ao buscar pintor:', error);
            return null;
        }

        return enrichPainterRowWithMedia(data);
    },

    async submitApplication(formData: ApplicationFormSubmission): Promise<ApplicationSubmissionResult> {
        const normalizedEmail = formData.email.trim().toLowerCase();
        const normalizedFullName = formData.fullName.trim();
        const normalizedGender = formData.gender?.trim() || null;
        const normalizedCep = formData.cep.replace(/\D/g, '').slice(0, 8);
        const normalizedCity = formData.city.trim();
        const normalizedUf = formData.uf.trim().toUpperCase();
        const normalizedWhatsapp = formData.whatsapp.trim();
        const normalizedExperienceTime = formData.experienceTime.trim();
        const normalizedSpecialties = formData.specialty
            .map((item) => item.trim())
            .filter(Boolean);
        let authUserId: string | null = null;

        if (formData.password) {
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: normalizedEmail,
                password: formData.password,
                options: {
                    data: { full_name: normalizedFullName }
                }
            });
            authUserId = authData.user?.id ?? null;

            const authErrorMessage = authError?.message?.toLowerCase() ?? '';
            const isExistingUserError = EXISTING_USER_ERROR_PATTERNS.some((pattern) => authErrorMessage.includes(pattern));

            if (authError && !isExistingUserError) {
                console.error('Erro de autenticacao:', authError);
                throw new Error(`Erro ao criar acesso: ${authError.message}`);
            }

            // Quando o Supabase cria sessao imediatamente, o client passa a usar o role
            // authenticated. O cadastro publico abaixo precisa continuar operando sem sessao.
            if (authData.session) {
                const { error: signOutError } = await supabase.auth.signOut();

                if (signOutError) {
                    console.error('Erro ao restaurar contexto publico apos signUp:', signOutError);
                    throw new Error('Nao foi possivel concluir o cadastro apos criar o acesso. Tente novamente.');
                }
            }
        }

        const { data, error } = await supabase
            .from('applications')
            .insert([{
                auth_user_id: authUserId,
                full_name: normalizedFullName,
                gender: normalizedGender,
                cep: normalizedCep,
                city: normalizedCity,
                uf: normalizedUf,
                whatsapp: normalizedWhatsapp,
                email: normalizedEmail,
                experience_time: normalizedExperienceTime,
                specialties: normalizedSpecialties,
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
        const profilePhotoPath = profilePhotoPaths[0] ?? finalWorkPhotos.find((path) => path.includes('/profile-photo/')) ?? null;

        const { error: filesUpdateError } = await supabase
            .from('applications')
            .update({
                profile_photo_path: profilePhotoPath,
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
                    fullName: normalizedFullName,
                    email: normalizedEmail,
                    city: normalizedCity,
                    experienceTime: normalizedExperienceTime
                },
                uploadedFiles: {
                    workPhotoCount: workPhotoPaths.length,
                    certificationCount: certificationPaths.length
                },
                specialties: normalizedSpecialties,
                specialtiesCount: normalizedSpecialties.length
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
