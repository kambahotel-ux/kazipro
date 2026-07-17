import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface DevisItem {
  description: string;
  quantite: number;
  prix_unitaire: number;
  montant: number;
  unite?: string;
}

interface EntrepriseInfo {
  nom_entreprise: string;
  logo_url?: string;
  adresse?: string;
  ville?: string;
  telephone?: string;
  email_professionnel?: string;
  numero_fiscal?: string;
  conditions_generales?: string;
  signature_url?: string;
}

interface ClientInfo {
  nom: string;
  adresse?: string;
  ville?: string;
  telephone?: string;
  email?: string;
}

interface DevisData {
  numero: string;
  date: string;
  entreprise: EntrepriseInfo;
  client: ClientInfo;
  items: DevisItem[];
  montant_ht: number;
  tva?: number;
  montant_ttc: number;
  devise: string;
  titre?: string;
  delai_execution?: string;
  conditions_paiement?: string;
}

interface ReceiptData {
  numero: string;
  date: string;
  statut: string;
  methode_paiement: string;
  type_paiement: string;
  montant_total: number;
  devise?: string;
  prestataire?: {
    nom?: string;
    profession?: string;
  };
  transaction_id?: string;
  reference_paiement?: string;
}

interface ContractParty {
  nom?: string;
  email?: string;
  telephone?: string;
  ville?: string;
  profession?: string;
  signature_url?: string;
  date_signature?: string;
}

export interface ContractData {
  numero: string;
  date: string;
  devisNumero?: string;
  titre?: string;
  description?: string;
  montantTotal: number;
  devise?: string;
  acomptePercent?: number;
  soldePercent?: number;
  delaiExecution?: string;
  garantie?: string;
  client: ContractParty;
  prestataire: ContractParty;
}

type PdfColor = [number, number, number];

const COLORS = {
  ink: [15, 23, 42] as PdfColor,
  muted: [100, 116, 139] as PdfColor,
  line: [203, 213, 225] as PdfColor,
  soft: [248, 250, 252] as PdfColor,
  brand: [22, 101, 52] as PdfColor,
  brandDark: [20, 83, 45] as PdfColor,
  success: [22, 163, 74] as PdfColor,
};

const A4 = {
  marginX: 16,
  marginTop: 16,
  marginBottom: 18,
};

function formatMoney(amount = 0, devise = 'FC') {
  return `${Number(amount || 0).toLocaleString('fr-FR')} ${devise}`;
}

function formatPaiementStatutPdf(statut?: string): string {
  const labels: Record<string, string> = {
    en_attente: 'En attente',
    en_cours: 'En cours',
    valide: 'Validé',
    complete: 'Complété',
    echoue: 'Échoué',
    annule: 'Annulé',
    rembourse: 'Remboursé',
    pending: 'En attente',
    in_progress: 'En cours',
    completed: 'Complété',
  };
  const key = String(statut ?? '').toLowerCase();
  return labels[key] ?? (statut ? String(statut) : '—');
}

function formatMethodePaiementPdf(methode?: string): string {
  const key = String(methode ?? '').toLowerCase().replace(/-/g, '_');
  const labels: Record<string, string> = {
    mpesa: 'M-Pesa',
    m_pesa: 'M-Pesa',
    mobile_money: 'Mobile Money',
    airtel_money: 'Airtel Money',
    orange_money: 'Orange Money',
    virement: 'Virement bancaire',
    especes: 'Espèces',
  };
  return labels[key] ?? (methode ? methode.replace(/_/g, ' ') : 'N/A');
}

function formatTypePaiementPdf(type?: string): string {
  const key = String(type ?? '').toLowerCase();
  const labels: Record<string, string> = {
    acompte: 'Acompte',
    solde: 'Solde',
    total: 'Paiement total',
  };
  return labels[key] ?? (type ? type.replace(/_/g, ' ') : 'N/A');
}

function cleanFilePart(value?: string) {
  return (value || 'document')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 60);
}

function addFooter(doc: jsPDF, label: string) {
  const pageCount = doc.getNumberOfPages();
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();

  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(...COLORS.line);
    doc.line(A4.marginX, height - 13, width - A4.marginX, height - 13);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...COLORS.muted);
    doc.text(label, A4.marginX, height - 8);
    doc.text(`Page ${page}/${pageCount}`, width - A4.marginX, height - 8, { align: 'right' });
  }
}

function ensureRoom(doc: jsPDF, y: number, needed: number) {
  const height = doc.internal.pageSize.getHeight();
  if (y + needed <= height - A4.marginBottom) return y;
  doc.addPage();
  return A4.marginTop;
}

function textBlock(doc: jsPDF, text: string, x: number, y: number, width: number, lineHeight = 5) {
  const lines = doc.splitTextToSize(text || '', width);
  doc.text(lines, x, y);
  return y + lines.length * lineHeight;
}

async function maybeAddImage(doc: jsPDF, url: string | undefined, x: number, y: number, w: number, h: number) {
  if (!url) return false;

  try {
    const base64 = await loadImageAsBase64(url);
    doc.addImage(base64, 'PNG', x, y, w, h, undefined, 'FAST');
    return true;
  } catch (error) {
    console.warn('Image PDF ignorée:', error);
    return false;
  }
}

export async function generateDevisPDF(devisData: DevisData): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - A4.marginX * 2;
  let y = A4.marginTop;

  const logoAdded = await maybeAddImage(doc, devisData.entreprise.logo_url, A4.marginX, y, 22, 22);
  if (!logoAdded) {
    doc.setFillColor(...COLORS.brand);
    doc.roundedRect(A4.marginX, y, 22, 22, 2, 2, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text('KP', A4.marginX + 11, y + 14, { align: 'center' });
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...COLORS.ink);
  doc.text(devisData.entreprise.nom_entreprise || 'Prestataire', A4.marginX + 28, y + 6);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.muted);
  const companyLines = [
    devisData.entreprise.adresse,
    devisData.entreprise.ville,
    devisData.entreprise.telephone ? `Tél. ${devisData.entreprise.telephone}` : '',
    devisData.entreprise.email_professionnel,
    devisData.entreprise.numero_fiscal ? `RCCM / ID: ${devisData.entreprise.numero_fiscal}` : '',
  ].filter(Boolean);
  companyLines.forEach((line, index) => {
    doc.text(String(line), A4.marginX + 28, y + 12 + index * 4);
  });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...COLORS.brandDark);
  doc.text('DEVIS', pageWidth - A4.marginX, y + 7, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  doc.text(`N° ${devisData.numero || 'N/A'}`, pageWidth - A4.marginX, y + 15, { align: 'right' });
  doc.text(devisData.date, pageWidth - A4.marginX, y + 20, { align: 'right' });

  y += 34;
  doc.setDrawColor(...COLORS.line);
  doc.line(A4.marginX, y, pageWidth - A4.marginX, y);
  y += 10;

  doc.setFillColor(...COLORS.soft);
  doc.roundedRect(A4.marginX, y, contentWidth, 30, 2, 2, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.muted);
  doc.text('OBJET', A4.marginX + 5, y + 7);
  doc.text('CLIENT', pageWidth / 2 + 4, y + 7);

  doc.setTextColor(...COLORS.ink);
  doc.setFontSize(11);
  doc.text(devisData.titre || 'Prestation de services', A4.marginX + 5, y + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  if (devisData.delai_execution) {
    doc.text(`Délai: ${devisData.delai_execution}`, A4.marginX + 5, y + 21);
  }

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...COLORS.ink);
  doc.text(devisData.client.nom || 'Client', pageWidth / 2 + 4, y + 14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...COLORS.muted);
  [devisData.client.adresse, devisData.client.ville, devisData.client.telephone, devisData.client.email]
    .filter(Boolean)
    .slice(0, 3)
    .forEach((line, index) => doc.text(String(line), pageWidth / 2 + 4, y + 20 + index * 4));

  y += 42;
  const tableX = A4.marginX;
  const tableW = contentWidth;
  const col = {
    desc: tableX + 4,
    qty: tableX + tableW - 72,
    unit: tableX + tableW - 56,
    pu: tableX + tableW - 30,
    total: tableX + tableW - 4,
  };

  const drawTableHeader = () => {
    doc.setFillColor(...COLORS.ink);
    doc.rect(tableX, y, tableW, 9, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('Désignation', col.desc, y + 6);
    doc.text('Qté', col.qty, y + 6, { align: 'center' });
    doc.text('Unité', col.unit, y + 6, { align: 'center' });
    doc.text('P.U.', col.pu, y + 6, { align: 'right' });
    doc.text('Montant', col.total, y + 6, { align: 'right' });
    y += 9;
  };

  drawTableHeader();
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  devisData.items.forEach((item, index) => {
    const descLines = doc.splitTextToSize(item.description || '-', 88);
    const rowH = Math.max(9, descLines.length * 4.2 + 5);
    y = ensureRoom(doc, y, rowH + 34);
    if (y === A4.marginTop) drawTableHeader();

    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(tableX, y, tableW, rowH, 'F');
    }

    doc.setDrawColor(226, 232, 240);
    doc.line(tableX, y + rowH, tableX + tableW, y + rowH);
    doc.setTextColor(...COLORS.ink);
    doc.text(descLines, col.desc, y + 5);
    doc.text(String(item.quantite || 0), col.qty, y + 5, { align: 'center' });
    doc.text(item.unite || 'u', col.unit, y + 5, { align: 'center' });
    doc.text(formatMoney(item.prix_unitaire, devisData.devise), col.pu, y + 5, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(formatMoney(item.montant, devisData.devise), col.total, y + 5, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    y += rowH;
  });

  y = ensureRoom(doc, y + 8, 52);
  const totalsX = pageWidth - A4.marginX - 72;
  doc.setDrawColor(...COLORS.line);
  doc.roundedRect(totalsX, y, 72, 34, 2, 2);
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  doc.text('Montant HT', totalsX + 5, y + 8);
  doc.text(formatMoney(devisData.montant_ht, devisData.devise), totalsX + 67, y + 8, { align: 'right' });

  const tvaAmount = devisData.montant_ttc - devisData.montant_ht;
  doc.text(`TVA${devisData.tva ? ` (${devisData.tva}%)` : ''}`, totalsX + 5, y + 16);
  doc.text(formatMoney(tvaAmount, devisData.devise), totalsX + 67, y + 16, { align: 'right' });

  doc.setFillColor(...COLORS.brand);
  doc.rect(totalsX, y + 23, 72, 11, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL TTC', totalsX + 5, y + 30);
  doc.text(formatMoney(devisData.montant_ttc, devisData.devise), totalsX + 67, y + 30, { align: 'right' });
  y += 46;

  if (devisData.conditions_paiement || devisData.entreprise.conditions_generales) {
    y = ensureRoom(doc, y, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.ink);
    doc.text('Conditions', A4.marginX, y);
    y += 6;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(...COLORS.muted);
    const conditionText = [devisData.conditions_paiement, devisData.entreprise.conditions_generales]
      .filter(Boolean)
      .join('\n');
    y = textBlock(doc, conditionText, A4.marginX, y, contentWidth, 4.4) + 4;
  }

  y = ensureRoom(doc, y, 34);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.ink);
  doc.text('Bon pour accord', A4.marginX, y);
  doc.text('Le prestataire', pageWidth - A4.marginX - 52, y);
  doc.setDrawColor(...COLORS.line);
  doc.roundedRect(A4.marginX, y + 5, 58, 24, 2, 2);
  doc.roundedRect(pageWidth - A4.marginX - 58, y + 5, 58, 24, 2, 2);
  await maybeAddImage(doc, devisData.entreprise.signature_url, pageWidth - A4.marginX - 52, y + 9, 44, 13);

  addFooter(doc, 'KaziPro - Devis généré électroniquement');
  doc.save(`Devis_${cleanFilePart(devisData.numero)}_${cleanFilePart(devisData.client.nom)}.pdf`);
}

export function generateReceiptPDF(receipt: ReceiptData): void {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = A4.marginTop;
  const devise = receipt.devise || 'FC';

  doc.setFillColor(...COLORS.brand);
  doc.roundedRect(A4.marginX, y, 24, 24, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('KP', A4.marginX + 12, y + 15, { align: 'center' });

  doc.setTextColor(...COLORS.ink);
  doc.setFontSize(24);
  doc.text('REÇU DE PAIEMENT', pageWidth - A4.marginX, y + 8, { align: 'right' });
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  doc.text(`N° ${receipt.numero || 'N/A'}`, pageWidth - A4.marginX, y + 16, { align: 'right' });
  doc.text(receipt.date, pageWidth - A4.marginX, y + 21, { align: 'right' });

  y += 38;
  doc.setFillColor(...COLORS.soft);
  doc.roundedRect(A4.marginX, y, pageWidth - A4.marginX * 2, 36, 2, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  doc.text('Montant payé', A4.marginX + 8, y + 11);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(28);
  doc.setTextColor(...COLORS.brandDark);
  doc.text(formatMoney(receipt.montant_total, devise), A4.marginX + 8, y + 25);
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.success);
  doc.text(
    formatPaiementStatutPdf(receipt.statut).toUpperCase(),
    pageWidth - A4.marginX - 8,
    y + 16,
    { align: 'right' },
  );

  y += 50;
  const rows = [
    ['Méthode', formatMethodePaiementPdf(receipt.methode_paiement)],
    ['Type de paiement', formatTypePaiementPdf(receipt.type_paiement)],
    ['Prestataire', receipt.prestataire?.nom || 'N/A'],
    ['Profession', receipt.prestataire?.profession || 'N/A'],
    ['Réf. transaction', receipt.transaction_id || '—'],
    ['Réf. paiement', receipt.reference_paiement || '—'],
  ];

  doc.setFontSize(10);
  rows.forEach(([label, value], index) => {
    const rowY = y + index * 11;
    doc.setDrawColor(...COLORS.line);
    doc.line(A4.marginX, rowY + 7, pageWidth - A4.marginX, rowY + 7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    doc.text(label, A4.marginX, rowY);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...COLORS.ink);
    doc.text(value, pageWidth - A4.marginX, rowY, { align: 'right' });
  });

  y += rows.length * 11 + 12;
  doc.setFillColor(255, 251, 235);
  doc.setDrawColor(245, 158, 11);
  doc.roundedRect(A4.marginX, y, pageWidth - A4.marginX * 2, 24, 2, 2, 'FD');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(120, 53, 15);
  textBlock(
    doc,
    'Ce reçu confirme l’enregistrement du paiement dans KaziPro. Les fonds seront traités selon les conditions prévues au contrat.',
    A4.marginX + 5,
    y + 8,
    pageWidth - A4.marginX * 2 - 10,
    4.2
  );

  addFooter(doc, 'KaziPro - Reçu généré électroniquement');
  doc.save(`Recu_${cleanFilePart(receipt.numero)}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export async function generateContractPDF(contract: ContractData): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const contentWidth = pageWidth - A4.marginX * 2;
  const devise = contract.devise || 'FC';
  const acomptePercent = contract.acomptePercent ?? 30;
  const soldePercent = contract.soldePercent ?? 70;
  const montantAcompte = Math.round((contract.montantTotal * acomptePercent) / 100);
  const montantSolde = contract.montantTotal - montantAcompte;
  let y = A4.marginTop;

  const section = (title: string) => {
    y = ensureRoom(doc, y, 18);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.brandDark);
    doc.text(title, A4.marginX, y);
    y += 4;
    doc.setDrawColor(...COLORS.line);
    doc.line(A4.marginX, y, pageWidth - A4.marginX, y);
    y += 7;
  };

  const partyBoxW = (contentWidth - 8) / 2;

  const partyBox = async (x: number, title: string, party: ContractParty, tone: PdfColor) => {
    doc.setDrawColor(...COLORS.line);
    doc.setFillColor(...COLORS.soft);
    doc.roundedRect(x, y, partyBoxW, 38, 2, 2, 'FD');
    doc.setFillColor(...tone);
    doc.rect(x, y, 2, 38, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...tone);
    doc.text(title, x + 6, y + 8);
    doc.setFontSize(10);
    doc.setTextColor(...COLORS.ink);
    doc.text(party.nom || 'N/A', x + 6, y + 15);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(...COLORS.muted);
    const lines = [
      party.profession,
      party.email,
      party.telephone ? `Tél. ${party.telephone}` : '',
      party.ville,
    ].filter(Boolean).slice(0, 4);
    lines.forEach((line, index) => doc.text(String(line), x + 6, y + 21 + index * 4));
  };

  doc.setFillColor(...COLORS.brand);
  doc.roundedRect(A4.marginX, y, 24, 24, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('KP', A4.marginX + 12, y + 15, { align: 'center' });

  doc.setTextColor(...COLORS.ink);
  doc.setFontSize(20);
  doc.text('CONTRAT DE PRESTATION', pageWidth - A4.marginX, y + 8, { align: 'right' });
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.muted);
  doc.text(`Contrat N° ${contract.numero || 'N/A'}`, pageWidth - A4.marginX, y + 16, { align: 'right' });
  doc.text(contract.date, pageWidth - A4.marginX, y + 21, { align: 'right' });

  y += 36;
  section('Entre les soussignés');
  await partyBox(A4.marginX, 'LE PRESTATAIRE', contract.prestataire, COLORS.brand);
  await partyBox(A4.marginX + partyBoxW + 8, 'LE CLIENT', contract.client, COLORS.success);
  y += 48;

  section('Article 1 - Objet du contrat');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.8);
  doc.setTextColor(...COLORS.ink);
  y = textBlock(
    doc,
    `Le présent contrat encadre la réalisation de la prestation "${contract.titre || 'Prestation de services'}"${contract.devisNumero ? `, issue du devis N° ${contract.devisNumero}` : ''}.`,
    A4.marginX,
    y,
    contentWidth,
    4.5
  ) + 4;
  if (contract.description) {
    y = ensureRoom(doc, y, 24);
    doc.setFillColor(255, 251, 235);
    doc.setDrawColor(245, 158, 11);
    doc.roundedRect(A4.marginX, y, contentWidth, 24, 2, 2, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(120, 53, 15);
    doc.text('Description des travaux', A4.marginX + 5, y + 7);
    doc.setFont('helvetica', 'normal');
    y = textBlock(doc, contract.description, A4.marginX + 5, y + 13, contentWidth - 10, 4.2);
    y += 8;
  }

  section('Article 2 - Montant et modalités de paiement');
  doc.setFillColor(...COLORS.soft);
  doc.roundedRect(A4.marginX, y, contentWidth, 24, 2, 2, 'F');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.muted);
  doc.text('Montant total des prestations', A4.marginX + 6, y + 8);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...COLORS.brandDark);
  doc.text(formatMoney(contract.montantTotal, devise), A4.marginX + 6, y + 18);
  y += 34;

  y = ensureRoom(doc, y, 28);
  doc.setFillColor(...COLORS.ink);
  doc.rect(A4.marginX, y, contentWidth, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text('Échéance', A4.marginX + 4, y + 5.5);
  doc.text('Montant', pageWidth - A4.marginX - 42, y + 5.5, { align: 'right' });
  doc.text('Pourcentage', pageWidth - A4.marginX - 4, y + 5.5, { align: 'right' });
  y += 8;
  [
    ['Acompte payable avant le début des travaux', montantAcompte, `${acomptePercent}%`],
    ['Solde payable après validation des travaux', montantSolde, `${soldePercent}%`],
  ].forEach((row, index) => {
    doc.setFillColor(index % 2 === 0 ? 250 : 255, index % 2 === 0 ? 250 : 255, index % 2 === 0 ? 250 : 255);
    doc.rect(A4.marginX, y, contentWidth, 10, 'F');
    doc.setDrawColor(...COLORS.line);
    doc.line(A4.marginX, y + 10, pageWidth - A4.marginX, y + 10);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.2);
    doc.setTextColor(...COLORS.ink);
    doc.text(String(row[0]), A4.marginX + 4, y + 6.5);
    doc.setFont('helvetica', 'bold');
    doc.text(formatMoney(Number(row[1]), devise), pageWidth - A4.marginX - 42, y + 6.5, { align: 'right' });
    doc.text(String(row[2]), pageWidth - A4.marginX - 4, y + 6.5, { align: 'right' });
    y += 10;
  });
  y += 8;

  section('Article 3 - Délais, garanties et obligations');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(...COLORS.ink);
  const obligations = [
    contract.delaiExecution ? `Délai d’exécution: ${contract.delaiExecution}.` : 'Le calendrier d’exécution est confirmé entre les parties avant le démarrage.',
    contract.garantie ? `Garantie: ${contract.garantie}.` : 'Le prestataire garantit une exécution professionnelle conforme au devis accepté.',
    'Le client facilite l’accès au lieu d’intervention et signale ses réserves dans les délais convenus.',
    'En cas de litige, les parties recherchent une solution amiable via KaziPro avant toute autre démarche.',
  ];
  obligations.forEach((item) => {
    y = ensureRoom(doc, y, 8);
    y = textBlock(doc, `• ${item}`, A4.marginX, y, contentWidth, 4.4) + 1;
  });

  y = ensureRoom(doc, y + 6, 42);
  section('Signatures');
  const signW = (contentWidth - 8) / 2;
  const drawSignature = async (x: number, label: string, party: ContractParty) => {
    doc.setDrawColor(...COLORS.line);
    doc.roundedRect(x, y, signW, 30, 2, 2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...COLORS.ink);
    doc.text(label, x + 5, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...COLORS.muted);
    doc.text(party.nom || 'N/A', x + 5, y + 13);
    if (party.signature_url) {
      await maybeAddImage(doc, party.signature_url, x + 5, y + 15, 42, 10);
    } else {
      doc.setDrawColor(148, 163, 184);
      doc.line(x + 5, y + 23, x + signW - 5, y + 23);
    }
    if (party.date_signature) {
      doc.text(`Signé le ${party.date_signature}`, x + 5, y + 27);
    }
  };
  await drawSignature(A4.marginX, 'Le prestataire', contract.prestataire);
  await drawSignature(A4.marginX + signW + 8, 'Le client', contract.client);

  addFooter(doc, 'KaziPro - Contrat généré électroniquement');
  doc.save(`Contrat_${cleanFilePart(contract.numero)}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export async function htmlElementToPdf(element: HTMLElement, fileName: string): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
    windowWidth: element.scrollWidth,
  });

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = pageWidth - 20;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;
  const imgData = canvas.toDataURL('image/png');

  let heightLeft = imgHeight;
  let position = 10;

  pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
  heightLeft -= pageHeight - 20;

  while (heightLeft > 0) {
    position = heightLeft - imgHeight + 10;
    pdf.addPage();
    pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
    heightLeft -= pageHeight - 20;
  }

  addFooter(pdf, 'KaziPro - Document généré électroniquement');
  pdf.save(fileName);
}

export async function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Impossible de préparer l’image'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };
    img.onerror = reject;
    img.src = url;
  });
}
