import { jsPDF } from 'jspdf';
import pintorProLogoUrl from '../imagens/Logo colorido PP.png';

type ContractPdfAmbiente = {
  nome: string;
  area: string;
  tecnicaDecorativaArea?: string;
  peDireito: string;
  superficie: string;
  valor?: string;
};

type ContractPdfPayload = {
  createdAt: string;
  painterName: string;
  painterProfilePhotoUrl?: string | null;
  painterEmail?: string | null;
  painterPhone?: string | null;
  painterLocation?: string | null;
  clientName: string;
  clientCpfCnpj?: string | null;
  clientPhone?: string | null;
  clientEmail?: string | null;
  clientType?: string | null;
  propertyAddress?: string | null;
  propertyCityState?: string | null;
  propertyType?: string | null;
  serviceType?: string | null;
  finishType?: string | null;
  paintType?: string | null;
  wallState?: string | null;
  prepServices?: string[];
  extraServices?: string[];
  startDate?: string | null;
  estimatedDeadline?: string | null;
  totalValue?: string | number | null;
  observations?: string | null;
  ambientes: ContractPdfAmbiente[];
};

type ContractPdfMode = 'download' | 'open';

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

const parseCurrencyValue = (value: string | number | null | undefined) => {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  const normalizedValue = String(value ?? '').trim();

  if (!normalizedValue) {
    return 0;
  }

  const sanitizedValue = normalizedValue.replace(/\s+/g, '').replace(/^R\$\s*/i, '');
  const hasComma = sanitizedValue.includes(',');
  const hasDot = sanitizedValue.includes('.');
  let numericString = sanitizedValue;

  if (hasComma && hasDot) {
    numericString = sanitizedValue.replace(/\./g, '').replace(',', '.');
  } else if (hasComma) {
    numericString = sanitizedValue.replace(',', '.');
  } else if (hasDot) {
    const dotParts = sanitizedValue.split('.');
    numericString = dotParts[dotParts.length - 1]?.length === 3
      ? sanitizedValue.replace(/\./g, '')
      : sanitizedValue;
  }

  const numericValue = Number(numericString.replace(/[^\d.-]/g, ''));
  return Number.isFinite(numericValue) ? numericValue : 0;
};

const formatCurrencyDisplay = (value: string | number | null | undefined) => (
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(parseCurrencyValue(value))
);

const sanitizeFileName = (value: string) => value
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-zA-Z0-9-_ ]+/g, '')
  .trim()
  .replace(/\s+/g, '-')
  .toLowerCase();

export const buildContractPdfFileName = (
  painterName: string,
  clientName: string,
  createdAt: string
) => (
  `contrato-${sanitizeFileName(painterName || 'pintor')}-${sanitizeFileName(clientName || 'cliente')}-${formatDisplayDate(createdAt).replace(/\//g, '-')}.pdf`
);

const blobToDataUrl = async (blob: Blob) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader();
  reader.onloadend = () => resolve(String(reader.result));
  reader.onerror = () => reject(new Error('Não foi possível converter imagem para o PDF.'));
  reader.readAsDataURL(blob);
});

const getImageDimensions = async (src: string) => new Promise<{ width: number; height: number } | null>((resolve) => {
  const image = new Image();
  image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
  image.onerror = () => resolve(null);
  image.src = src;
});

const getContainedImageSize = (
  sourceWidth: number,
  sourceHeight: number,
  maxWidth: number,
  maxHeight: number
) => {
  if (!sourceWidth || !sourceHeight) {
    return { width: maxWidth, height: maxHeight };
  }

  const scale = Math.min(maxWidth / sourceWidth, maxHeight / sourceHeight);

  return {
    width: Math.max(1, sourceWidth * scale),
    height: Math.max(1, sourceHeight * scale)
  };
};

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
    console.error('Erro ao carregar imagem para o PDF do contrato:', error);
    return null;
  }
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

export const generateContractPdf = async (
  payload: ContractPdfPayload,
  options?: { mode?: ContractPdfMode }
) => {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const brandLogoDataUrl = await fetchImageDataUrl(pintorProLogoUrl);
  const brandLogoDimensions = brandLogoDataUrl ? await getImageDimensions(brandLogoDataUrl) : null;
  const painterHeaderImage = await fetchImageDataUrl(payload.painterProfilePhotoUrl);
  const painterHeaderImageDimensions = painterHeaderImage ? await getImageDimensions(painterHeaderImage) : null;
  let y = PAGE_MARGIN;

  const drawFooter = async () => {
    const footerY = pageHeight - 34;

    doc.setDrawColor(...LIGHT_BORDER);
    doc.line(PAGE_MARGIN, footerY - 14, pageWidth - PAGE_MARGIN, footerY - 14);

    if (brandLogoDataUrl) {
      const footerLogo = getContainedImageSize(
        brandLogoDimensions?.width ?? 1,
        brandLogoDimensions?.height ?? 1,
        54,
        18
      );

      doc.addImage(
        brandLogoDataUrl,
        'PNG',
        PAGE_MARGIN,
        footerY - (footerLogo.height / 2) - 2,
        footerLogo.width,
        footerLogo.height,
        undefined,
        'FAST'
      );
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED_TEXT);
    doc.text('Modelo base de contrato da Pintor Pro. Recomenda-se revisao juridica antes da assinatura.', PAGE_MARGIN + 76, footerY + 4);
  };

  const ensureSpace = async (requiredHeight: number) => {
    if (y + requiredHeight <= pageHeight - 84) {
      return;
    }

    await drawFooter();
    doc.addPage();
    y = PAGE_MARGIN;
  };

  const addSectionTitle = async (title: string) => {
    await ensureSpace(38);
    doc.setDrawColor(...LIGHT_BORDER);
    doc.line(PAGE_MARGIN, y, pageWidth - PAGE_MARGIN, y);
    y += 18;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12.5);
    doc.setTextColor(...BRAND_BLUE);
    doc.text(title, PAGE_MARGIN, y);
    y += 16;
  };

  const addParagraph = async (text: string) => {
    if (!text.trim()) {
      return;
    }

    const wrappedText = doc.splitTextToSize(text, pageWidth - (PAGE_MARGIN * 2));
    const requiredHeight = wrappedText.length * 14 + 8;
    await ensureSpace(requiredHeight);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...SLATE_TEXT);
    doc.text(wrappedText, PAGE_MARGIN, y);
    y += wrappedText.length * 14 + 8;
  };

  const addBulletList = async (items: string[]) => {
    for (const item of items.filter(Boolean)) {
      const wrappedText = doc.splitTextToSize(`• ${item}`, pageWidth - (PAGE_MARGIN * 2));
      const requiredHeight = wrappedText.length * 14 + 4;
      await ensureSpace(requiredHeight);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10.5);
      doc.setTextColor(...SLATE_TEXT);
      doc.text(wrappedText, PAGE_MARGIN, y);
      y += wrappedText.length * 14 + 4;
    }
  };

  const addPartyCard = async (title: string, lines: string[]) => {
    const filteredLines = lines.filter((line) => line.trim());
    if (!filteredLines.length) {
      return;
    }

    const wrappedLines = filteredLines.flatMap((line) => doc.splitTextToSize(line, (pageWidth - (PAGE_MARGIN * 2)) / 2 - 24));
    const cardHeight = 28 + (wrappedLines.length * 14) + 16;
    await ensureSpace(cardHeight + 12);

    doc.setFillColor(...LIGHT_PANEL);
    doc.roundedRect(PAGE_MARGIN, y, pageWidth - (PAGE_MARGIN * 2), cardHeight, 16, 16, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(...BRAND_PINK);
    doc.text(title.toUpperCase(), PAGE_MARGIN + 14, y + 18);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.setTextColor(...SLATE_TEXT);
    doc.text(wrappedLines, PAGE_MARGIN + 14, y + 36);
    y += cardHeight + 12;
  };

  doc.setFillColor(...BRAND_BLUE);
  doc.rect(0, 0, pageWidth, 16, 'F');
  doc.setFillColor(...BRAND_PINK);
  doc.rect(pageWidth * 0.42, 0, pageWidth * 0.58, 16, 'F');

  const headerImageBoxSize = 54;
  let headerTextStartX = PAGE_MARGIN;
  let headerTextWidth = pageWidth - (PAGE_MARGIN * 2);

  if (painterHeaderImage) {
    const headerImageSize = getContainedImageSize(
      painterHeaderImageDimensions?.width ?? 1,
      painterHeaderImageDimensions?.height ?? 1,
      headerImageBoxSize,
      headerImageBoxSize
    );

    const headerImageX = PAGE_MARGIN + ((headerImageBoxSize - headerImageSize.width) / 2);
    const headerImageY = y + ((headerImageBoxSize - headerImageSize.height) / 2);

    doc.addImage(
      painterHeaderImage,
      'PNG',
      headerImageX,
      headerImageY,
      headerImageSize.width,
      headerImageSize.height,
      undefined,
      'FAST'
    );

    headerTextStartX = PAGE_MARGIN + headerImageBoxSize + 14;
    headerTextWidth = pageWidth - headerTextStartX - PAGE_MARGIN;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...BRAND_BLUE);
  const painterNameLines = doc.splitTextToSize(payload.painterName, headerTextWidth);
  const painterNameLineHeight = 18;
  const painterNameStartY = y + 16;
  doc.text(painterNameLines, headerTextStartX, painterNameStartY);

  const painterNameBottomY = painterNameStartY + ((painterNameLines.length - 1) * painterNameLineHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...BRAND_BLUE);
  const contractTitleY = painterNameBottomY + 20;
  doc.text('CONTRATO DE PRESTAÇÃO DE SERVIÇO DE PINTURA', headerTextStartX, contractTitleY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(...MUTED_TEXT);
  const issuedAtY = contractTitleY + 18;
  doc.text(`Emitido em ${formatDisplayDate(payload.createdAt)}`, headerTextStartX, issuedAtY);

  const headerBottomY = Math.max(
    issuedAtY,
    y + (painterHeaderImage ? headerImageBoxSize : 0)
  );
  y = headerBottomY + 20;

  await addParagraph(
    'Instrumento particular que organiza a contratação direta entre cliente e profissional de pintura, com base nas informações registradas na plataforma Pintor Pro.'
  );

  await addSectionTitle('1. Partes');
  await addPartyCard('Contratante', [
    payload.clientName,
    payload.clientCpfCnpj ? `CPF/CNPJ: ${payload.clientCpfCnpj}` : '',
    payload.clientPhone ? `Telefone: ${payload.clientPhone}` : '',
    payload.clientEmail ? `E-mail: ${payload.clientEmail}` : '',
    payload.clientType ? `Tipo: ${payload.clientType}` : ''
  ]);
  await addPartyCard('Contratado', [
    payload.painterName,
    payload.painterPhone ? `WhatsApp: ${payload.painterPhone}` : '',
    payload.painterEmail ? `E-mail: ${payload.painterEmail}` : '',
    payload.painterLocation ? `Base: ${payload.painterLocation}` : ''
  ]);

  await addSectionTitle('2. Objeto do contrato');
  await addParagraph(
    `O presente contrato tem como objeto a execução dos serviços de ${payload.serviceType || 'pintura imobiliária'} no imóvel ${payload.propertyType ? `do tipo ${payload.propertyType}` : 'objeto deste contrato'}, localizado em ${payload.propertyAddress || 'endereço a confirmar'}${payload.propertyCityState ? `, ${payload.propertyCityState}` : ''}.`
  );

  const environmentSummary = payload.ambientes
    .map((ambiente, index) => {
      const parts = [
        ambiente.nome.trim() || `Ambiente ${index + 1}`,
        ambiente.area.trim() ? `${ambiente.area.trim()} m2` : '',
        ambiente.tecnicaDecorativaArea?.trim() ? `Decorativo ${ambiente.tecnicaDecorativaArea.trim()} m2` : '',
        ambiente.superficie.trim() ? `Superfície: ${ambiente.superficie.trim()}` : '',
        ambiente.valor?.trim() ? `Valor: ${formatCurrencyDisplay(ambiente.valor)}` : ''
      ].filter(Boolean);

      return parts.join(' | ');
    })
    .filter(Boolean);

  if (environmentSummary.length > 0) {
    await addSectionTitle('3. Escopo resumido');
    await addBulletList(environmentSummary);
  }

  await addParagraph(
    `Acabamentos previstos: ${payload.finishType || 'a definir entre as partes'}. Tipos de tinta previstos: ${payload.paintType || 'a definir entre as partes'}. Estado da superfície informado: ${payload.wallState || 'não informado'}.`
  );

  if ((payload.prepServices ?? []).length > 0) {
    await addParagraph(`Preparação prevista: ${(payload.prepServices ?? []).join(', ')}.`);
  }

  if ((payload.extraServices ?? []).length > 0) {
    await addParagraph(`Serviços complementares previstos: ${(payload.extraServices ?? []).join(', ')}.`);
  }

  await addSectionTitle('4. Prazo');
  await addParagraph(
    `O início estimado dos serviços será ${payload.startDate ? formatDisplayDate(payload.startDate) : 'definido entre as partes'}, com prazo de execução ${payload.estimatedDeadline || 'a combinar'}, podendo haver ajuste por condições climáticas, liberação do ambiente, alterações solicitadas ou fatos alheios à vontade das partes.`
  );

  await addSectionTitle('5. Valor e pagamento');
  await addParagraph(
    `O valor total estimado deste contrato é ${parseCurrencyValue(payload.totalValue) > 0 ? formatCurrencyDisplay(payload.totalValue) : 'A COMBINAR ENTRE AS PARTES'}, observando o orçamento previamente aprovado.`
  );
  await addParagraph(
    'A forma de pagamento será ajustada diretamente entre CONTRATANTE e CONTRATADO. A Pintor Pro não intermedeia nem recebe pagamentos relativos a este contrato.'
  );

  await addSectionTitle('6. Obrigações do contratado');
  await addBulletList([
    'Executar os serviços com zelo técnico, boa-fé e observância do escopo aprovado.',
    'Informar previamente ao contratante qualquer necessidade adicional que altere prazo, material ou valor.',
    'Manter o ambiente organizado dentro do possível durante a execução dos trabalhos.',
    'Comunicar impedimentos relevantes que possam atrasar o cronograma.'
  ]);

  await addSectionTitle('7. Obrigações do contratante');
  await addBulletList([
    'Disponibilizar acesso ao imóvel, energia, água e demais condições mínimas para a execução do serviço.',
    'Validar previamente cores, acabamentos, ambientes e demais especificações do serviço.',
    'Efetuar os pagamentos diretamente ao contratado nas condições ajustadas entre as partes.',
    'Comunicar por escrito qualquer alteração relevante no escopo antes da execução.'
  ]);

  await addSectionTitle('8. Alterações, cancelamento e rescisão');
  await addParagraph(
    'Qualquer alteração de escopo, material, metragem, acabamento, técnica decorativa, prazo ou valor deverá ser ajustada por livre negociação entre as partes. Em caso de cancelamento ou rescisão, recomenda-se registrar por escrito o que já foi executado, os valores eventualmente devidos e os materiais já empregados.'
  );

  await addSectionTitle('9. Disposições gerais');
  await addParagraph(
    'As partes declaram que leram e compreenderam este instrumento, comprometendo-se a agir com probidade, transparência e boa-fé durante a contratação e a execução dos serviços.'
  );
  await addParagraph(
    'Este documento é um modelo-base operacional. Para contratos com exigências específicas, maior risco, garantias especiais, parcelamentos complexos ou obras de alto valor, recomenda-se revisão jurídica antes da assinatura.'
  );

  if (payload.observations?.trim()) {
    await addSectionTitle('10. Observações complementares');
    await addParagraph(payload.observations.trim());
  }

  await ensureSpace(170);
  doc.setDrawColor(...LIGHT_BORDER);
  doc.line(PAGE_MARGIN, y + 56, PAGE_MARGIN + 210, y + 56);
  doc.line(pageWidth - PAGE_MARGIN - 210, y + 56, pageWidth - PAGE_MARGIN, y + 56);
  doc.line(PAGE_MARGIN, y + 124, PAGE_MARGIN + 210, y + 124);
  doc.line(pageWidth - PAGE_MARGIN - 210, y + 124, pageWidth - PAGE_MARGIN, y + 124);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...SLATE_TEXT);
  doc.text('CONTRATANTE', PAGE_MARGIN, y + 72);
  doc.text('CONTRATADO', pageWidth - PAGE_MARGIN - 210, y + 72);
  doc.text('TESTEMUNHA 1', PAGE_MARGIN, y + 140);
  doc.text('TESTEMUNHA 2', pageWidth - PAGE_MARGIN - 210, y + 140);
  y += 152;

  await drawFooter();

  const fileName = buildContractPdfFileName(payload.painterName, payload.clientName, payload.createdAt);
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
