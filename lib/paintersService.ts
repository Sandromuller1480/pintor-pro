
import { supabase } from './supabase';
import { Painter } from '../types';

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

        // Mapear campos do banco (snake_case) para o tipo do frontend (camelCase) se necessário
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

    async submitApplication(formData: { fullName: string, city: string, whatsapp: string, email: string }) {
        // 1. Salvar no Supabase
        const { data, error } = await supabase
            .from('applications')
            .insert([{
                full_name: formData.fullName,
                city: formData.city,
                whatsapp: formData.whatsapp,
                email: formData.email,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) throw error;

        // 2. Processar Análise e Notificações (Assíncrono)
        this.processAutomatedAnalysis(data.id, formData);

        return data;
    },

    async processAutomatedAnalysis(applicationId: string, formData: any) {
        // Delay simulado de processamento da "IA" (Análise técnica)
        await new Promise(resolve => setTimeout(resolve, 5000));

        // CRITÉRIO DE ANÁLISE (Exemplo: Aceita se a cidade for informada corretamente)
        const isAccepted = formData.city.length > 3;
        const newStatus = isAccepted ? 'accepted' : 'rejected';

        // Atualizar Banco
        await supabase
            .from('applications')
            .update({
                status: newStatus,
                analysis_notes: isAccepted
                    ? 'Aprovado via Filtro Técnico Automático: Localização e identificação válidas.'
                    : 'Recusado: Dados insuficientes para validação PRO.'
            })
            .eq('id', applicationId);

        // ENVIAR NOTIFICAÇÃO REAL (APENAS E-MAIL)
        this.sendNotificationEmail(formData.email, formData.fullName, isAccepted);
    },

    async sendNotificationEmail(email: string, name: string, isAccepted: boolean) {
        const apiKey = import.meta.env.VITE_RESEND_API_KEY;
        if (!apiKey || apiKey.includes('aqui')) {
            console.warn('[AVISO] API Key do Resend não configurada. E-mail não enviado.');
            return;
        }

        try {
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    from: 'Pintor PRO <onboarding@resend.dev>',
                    to: email,
                    subject: isAccepted ? 'Parabéns! Você é um Pintor PRO 🏅' : 'Atualização sobre seu cadastro no Pintor PRO',
                    html: `
                        <div style="font-family: sans-serif; padding: 40px; color: #333; max-width: 600px; margin: auto; border: 1px solid #eee; border-radius: 32px; background-color: #ffffff; box-shadow: 0 10px 30px rgba(0,0,0,0.05);">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <h1 style="color: #000; font-size: 24px; font-weight: 900; letter-spacing: -1px; text-transform: uppercase;">PINTOR <span style="color: #2563eb;">PRO</span></h1>
                            </div>
                            
                            <h2 style="color: #1e293b; font-size: 20px; font-weight: 800; margin-bottom: 20px;">Olá, ${name}!</h2>
                            
                            <p style="font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 24px;">
                                ${isAccepted
                            ? 'Temos o prazer de informar que sua solicitação de credenciamento foi <strong>APROVADA</strong>. Você agora faz parte da elite da pintura brasileira.'
                            : 'Agradecemos o seu interesse no Padrão PRO. No momento, após nossa análise técnica automática, seu perfil não foi selecionado para o credenciamento.'}
                            </p>
                            
                            ${isAccepted ? `
                                <div style="background: #f8fafc; padding: 24px; border-radius: 16px; border-left: 4px solid #2563eb; margin-bottom: 24px;">
                                    <p style="margin: 0; font-weight: 800; color: #1e293b; font-size: 14px; text-transform: uppercase; letter-spacing: 1px;">Próximo Passo</p>
                                    <p style="margin: 8px 0 0 0; color: #64748b;">Acesse seu painel agora para configurar seu portfólio e começar a receber pedidos de obras de alto padrão.</p>
                                </div>
                            ` : ''}

                            <div style="border-top: 1px solid #f1f5f9; padding-top: 24px; margin-top: 40px;">
                                <p style="font-size: 12px; color: #94a3b8; text-align: center;">
                                    Este é um e-mail automático enviado pelo sistema de curadoria PINTOR PRO.
                                </p>
                            </div>
                        </div>
                    `
                })
            });
            console.log(`[SUCESSO] Notificação enviada para: ${email}`);
        } catch (e) {
            console.error('Erro ao enviar e-mail via Resend:', e);
        }
    }
};
