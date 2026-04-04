import { jsPDF } from 'jspdf';
import pintorProLogoUrl from '../imagens/Logo colorido PP.png';

type QuotePdfAmbiente = {
  nome: string;
  area: string;
  peDireito: string;
  superficie: string;
};

type QuotePdfPayload = {
  quoteId: string;
  createdAt: string;
  painterName: string;
  painterLocation?: string | null;
  painterProfilePhotoUrl?: string | null;
  clientName: string;
  clientCpfCnpj?: string;
  clientPhone: string;
  clientEmail?: string;
  clientType?: string;
  propertyAddress?: string;
  propertyCityState?: string;
  propertyType?: string;
  propertySituation?: string;
  propertyStatus?: string;
  serviceType?: string;
  finishType?: string;
  paintType?: string;
  wallState?: string;
  prepServices: string[];
  workHeight?: string;
  complexityNeeds: string[];
  accessLevel?: string;
  extraServices: string[];
  colorsDefined?: string;
  colorsQuantity?: string;
  colorConsulting?: string;
  startDate?: string;
  estimatedDeadline?: string;
  urgency?: string;
  materialSupply?: string;
  observations?: string;
  ambientes: QuotePdfAmbiente[];
};

type QuotePdfMode = 'download' | 'open';

const PAGE_MARGIN = 44;
const BRAND_BLUE: [number, number, number] = [0, 7, 71];
const BRAND_PINK: [number, number, number] = [154, 7, 123];
const SLATE_TEXT: [number, number, number] = [51, 65, 85];
const MUTED_TEXT: [number, number, number] = [100, 116, 139];
const LIGHT_BORDER: [number, number, number] = [226, 232, 240];
const LIGHT_PANEL: [number, number, number] = [248, 250, 252];

const formatDisplayDate = (value: string | null | undefined) => {
  if (!value) {
    return '';
  }

  const normalizedValue = value.includes('T') ? value : `${value}T00:00:00`;
  const parsedDate = new Date(normalizedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat('pt-BR').format(parsedDate);
};

const sanitizeFileName = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9-_ ]+/g, '')
  .trim()
  .replace(/\s+/g, '-')
  .toLowerCase();

export const buildQuotePdfFileName = (painterName: string, createdAt: string) => (
  `orcamento-${sanitizeFileName(painterName || 'pintor')}-${formatDisplayDate(createdAt).replace(/\//g, '-')}.pdf`
);

const blobToDataUrl = async (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(String(reader.result));
  reader.onerror = () => reject(new Error('Nao foi possivel converter imagem para o PDF.'));
  reader.readAsDataURL(blob);
});

const fetchImageDataUrl = async (src: string | null | undefined) => {
  if (!src) {
    return null;
  }

  try {
    const response = await fetch(src);

    if (!response.ok) {
      return null;
    }

    const blob = await response.blob();
    return await blobToDataUrl(blob);
  } catch (error) {
    console.error('Erro ao carregar imagem para o PDF:', error);
    return null;
  }
};

const drawFooter = async (doc: jsPDF, pageWidth: number, pageHeight: number, logoDataUrl: string | null) => {
  const footerY = pageHeight - 34;

  doc.setDrawColor(...LIGHT_BORDER);
  doc.line(PAGE_MARGIN, footerY - 14, pageWidth - PAGE_MARGIN, footerY - 14);

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', PAGE_MARGIN, footerY - 8, 18, 18, undefined, 'FAST');
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...MUTED_TEXT);
  doc.text('PINTOR PRO', PAGE_MARGIN + 26, footerY + 4);

  doc.setFont('helvetica', 'normal');
  doc.text('Documento profissional gerado pela plataforma.', PAGE_MARGIN + 82, footerY + 4);
};

const downloadBlob = (blob: Blob, fileName: string) => {
  const objectUrl = URL.createObjectURL(blob);
  const tempLink = document.createElement('a');
  tempLink.href = objectUrl;
  tempLink.download = fileName;
  tempLink.click();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5000);
};

const openBlobInNewTab = (blob: Blob) => {
  const objectUrl = URL.createObjectURL(blob);
  const openedWindow = window.open(objectUrl, '_blank', 'noopener,noreferrer');

  if (!openedWindow) {
    return false;
  }

  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 5 * 60 * 1000);
  return true;
};

export const generateQuotePdf = async (
  payload: QuotePdfPayload,
  options?: { mode?: QuotePdfMode }
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const brandLogoDataUrl = await fetchImageDataUrl(pintorProLogoUrl);
  const painterHeaderImage = await fetchImageDataUrl(payload.painterProfilePhotoUrl) ?? brandLogoDataUrl;

  let y = PAGE_MARGIN;

  const ensureSpace = async (requiredHeight: number) => {
    if (y + requiredHeight <= pageHeight - 72) {
      return;
    }

    await drawFooter(doc, pageWidth, pageHeight, brandLogoDataUrl);
    doc.addPage();
    y = PAGE_MARGIN;
  };

  const addSectionTitle = async (title: string) => {
    await ensureSpace(40);
    doc.setDrawColor(...LIGHT_BORDER);
    doc.line(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN, y);
    y += 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(...BRAND_BLUE);
    doc.text(title, PAGE_MARGIN, y);
    y += 18;
  };

  const addField = async (label: string, value: string) => {
    if (!value.trim()) {
      return;
    }

    const maxWidth = pageWidth - (PAGE_MARGIN * 2);
    const wrappedValue = doc.splitTextToSize(value, maxWidth);
    const requiredHeight = 16 + (wrappedValue.length * 14) + 8;
    await ensureSpace(requiredHeight);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...MUTED_TEXT);
    doc.text(label.toUpperCase(), PAGE_MARGIN, y);
    y += 14;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...SLATE_TEXT);
    doc.text(wrappedValue, PAGE_MARGIN, y);
    y += wrappedValue.length * 14 + 8;
  };

  doc.setFillColor(...BRAND_BLUE);
  doc.rect(0, 0, pageWidth, 16, 'F');
  doc.setFillColor(...BRAND_PINK);
  doc.rect(pageWidth * 0.42, 0, pageWidth * 0.58, 16, 'F');

  if (painterHeaderImage) {
    doc.addImage(painterHeaderImage, 'PNG', PAGE_MARGIN, y, 56, 56, undefined, 'FAST');
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(...BRAND_BLUE);
  doc.text(payload.painterName, PAGE_MARGIN + 72, y + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...MUTED_TEXT);
  doc.text(payload.painterLocation || 'Pintor Pro', PAGE_MARGIN + 72, y + 40);

  doc.setFillColor(...LIGHT_PANEL);
  doc.roundedRect(pageWidth - 180, y, 136, 46, 12, 12, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BRAND_PINK);
  doc.text('ORCAMENTO PROFISSIONAL', pageWidth - 168, y + 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...SLATE_TEXT);
  doc.text(`Emissao: ${formatDisplayDate(payload.createdAt)}`, pageWidth - 168, y + 33);

  y += 82;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...SLATE_TEXT);
  doc.text('Atendimento organizado com a garantia e seguranca da Pintor Pro.', PAGE_MARGIN, y);
  y += 26;

  await addSectionTitle('1. Dados do cliente');
  await addField('Nome', payload.clientName);
  await addField('CPF / CNPJ', payload.clientCpfCnpj || '');
  await addField('Telefone', payload.clientPhone);
  await addField('E-mail', payload.clientEmail || '');
  await addField('Tipo de cliente', payload.clientType || '');

  await addSectionTitle('2. Dados do imovel');
  await addField('Endereco', payload.propertyAddress || '');
  await addField('Cidade / Estado', payload.propertyCityState || '');
  await addField('Tipo de imovel', payload.propertyType || '');
  await addField('Situacao', payload.propertySituation || '');
  await addField('Status', payload.propertyStatus || '');

  await addSectionTitle('3. Escopo do servico');
  await addField('Tipo de servico', payload.serviceType || '');
  await addField('Acabamento', payload.finishType || '');
  await addField('Tipo de tinta', payload.paintType || '');
  await addField('Situacao da parede', payload.wallState || '');
  await addField('Preparacao necessaria', payload.prepServices.join(', '));

  if (payload.ambientes.length > 0) {
    await addField(
      'Ambientes',
      payload.ambientes
        .map((ambiente, index) => {
          const parts = [
            ambiente.nome.trim() || `Ambiente ${index + 1}`,
            ambiente.area.trim() ? `${ambiente.area.trim()} m2` : '',
            ambiente.peDireito.trim(),
            ambiente.superficie.trim()
          ].filter(Boolean);

          return parts.join(' | ');
        })
        .join('\n')
    );
  }

  await addSectionTitle('4. Complexidade e prazo');
  await addField('Altura do trabalho', payload.workHeight || '');
  await addField('Necessidades de acesso', payload.complexityNeeds.join(', '));
  await addField('Acesso ao local', payload.accessLevel || '');
  await addField('Urgencia', payload.urgency || '');
  await addField('Inicio ideal', formatDisplayDate(payload.startDate));
  await addField('Prazo estimado', payload.estimatedDeadline || '');

  await addSectionTitle('5. Materiais e observacoes');
  await addField('Fornecimento de materiais', payload.materialSupply || '');
  await addField('Cores definidas', payload.colorsDefined || '');
  await addField('Quantidade de cores', payload.colorsQuantity || '');
  await addField('Consultoria de cores', payload.colorConsulting || '');
  await addField('Servicos extras', payload.extraServices.join(', '));
  await addField('Observacoes', payload.observations || '');

  await ensureSpace(70);
  doc.setFillColor(...LIGHT_PANEL);
  doc.roundedRect(PAGE_MARGIN, y, pageWidth - (PAGE_MARGIN * 2), 54, 16, 16, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BRAND_PINK);
  doc.text('PINTOR PRO', PAGE_MARGIN + 16, y + 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...SLATE_TEXT);
  doc.text('Negociacao organizada pela plataforma, com relacao direta entre cliente e pintor.', PAGE_MARGIN + 16, y + 36);

  await drawFooter(doc, pageWidth, pageHeight, brandLogoDataUrl);

  const fileName = buildQuotePdfFileName(payload.painterName, payload.createdAt);
  const pdfBlob = doc.output('blob');
  const mode = options?.mode ?? 'download';

  if (mode === 'open') {
    const opened = openBlobInNewTab(pdfBlob);

    if (!opened) {
      downloadBlob(pdfBlob, fileName);
    }

    return;
  }

  downloadBlob(pdfBlob, fileName);
};
