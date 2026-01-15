import jsPDF from 'jspdf';

interface DevisItem {
  description: string;
  quantite: number;
  prix_unitaire: number;
  montant: number;
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
}

interface ClientInfo {
  nom: string;
  adresse?: string;
  ville?: string;
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
  delai_execution?: string;
  conditions_paiement?: string;
}

export async function generateDevisPDF(devisData: DevisData): Promise<void> {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPos = 20;

  // Colors
  const primaryColor: [number, number, number] = [59, 130, 246]; // Blue
  const textColor: [number, number, number] = [51, 51, 51];
  const lightGray: [number, number, number] = [240, 240, 240];

  // ============================================
  // HEADER - Logo & Company Info
  // ============================================
  
  // Logo (if available)
  if (devisData.entreprise.logo_url) {
    try {
      // Note: In production, you'd need to handle CORS and convert image to base64
      // For now, we'll add a placeholder
      doc.setFillColor(...lightGray);
      doc.rect(20, yPos, 40, 40, 'F');
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text('LOGO', 40, yPos + 22, { align: 'center' });
    } catch (error) {
      console.error('Error loading logo:', error);
    }
  }

  // Company Info (right side)
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  doc.text(devisData.entreprise.nom_entreprise || 'Entreprise', pageWidth - 20, yPos, { align: 'right' });
  
  yPos += 8;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  if (devisData.entreprise.adresse) {
    doc.text(devisData.entreprise.adresse, pageWidth - 20, yPos, { align: 'right' });
    yPos += 5;
  }
  
  if (devisData.entreprise.ville) {
    doc.text(devisData.entreprise.ville, pageWidth - 20, yPos, { align: 'right' });
    yPos += 5;
  }
  
  if (devisData.entreprise.telephone) {
    doc.text(`Tél: ${devisData.entreprise.telephone}`, pageWidth - 20, yPos, { align: 'right' });
    yPos += 5;
  }
  
  if (devisData.entreprise.email_professionnel) {
    doc.text(`Email: ${devisData.entreprise.email_professionnel}`, pageWidth - 20, yPos, { align: 'right' });
    yPos += 5;
  }
  
  if (devisData.entreprise.numero_fiscal) {
    doc.text(`RCCM: ${devisData.entreprise.numero_fiscal}`, pageWidth - 20, yPos, { align: 'right' });
    yPos += 5;
  }

  yPos += 15;

  // ============================================
  // TITLE - DEVIS
  // ============================================
  doc.setFillColor(...primaryColor);
  doc.rect(20, yPos, pageWidth - 40, 12, 'F');
  
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('DEVIS', pageWidth / 2, yPos + 8, { align: 'center' });
  
  yPos += 20;

  // ============================================
  // DEVIS INFO & CLIENT INFO
  // ============================================
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  
  // Left column - Devis info
  doc.text('Devis N°:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(devisData.numero, 50, yPos);
  
  yPos += 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(devisData.date, 50, yPos);
  
  // Right column - Client info
  yPos -= 7;
  doc.setFont('helvetica', 'bold');
  doc.text('Client:', pageWidth - 90, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(devisData.client.nom, pageWidth - 60, yPos);
  
  if (devisData.client.adresse) {
    yPos += 7;
    doc.text(devisData.client.adresse, pageWidth - 60, yPos);
  }
  
  if (devisData.client.ville) {
    yPos += 7;
    doc.text(devisData.client.ville, pageWidth - 60, yPos);
  }

  yPos += 15;

  // ============================================
  // TABLE - Items
  // ============================================
  
  // Table header
  doc.setFillColor(...lightGray);
  doc.rect(20, yPos, pageWidth - 40, 10, 'F');
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...textColor);
  
  doc.text('Description', 25, yPos + 7);
  doc.text('Qté', pageWidth - 90, yPos + 7, { align: 'center' });
  doc.text('P.U.', pageWidth - 60, yPos + 7, { align: 'right' });
  doc.text('Montant', pageWidth - 25, yPos + 7, { align: 'right' });
  
  yPos += 10;

  // Table rows
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  
  devisData.items.forEach((item, index) => {
    // Check if we need a new page
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = 20;
    }

    // Alternate row colors
    if (index % 2 === 0) {
      doc.setFillColor(250, 250, 250);
      doc.rect(20, yPos, pageWidth - 40, 8, 'F');
    }

    doc.text(item.description, 25, yPos + 6);
    doc.text(item.quantite.toString(), pageWidth - 90, yPos + 6, { align: 'center' });
    doc.text(`${item.prix_unitaire.toLocaleString()} ${devisData.devise}`, pageWidth - 60, yPos + 6, { align: 'right' });
    doc.text(`${item.montant.toLocaleString()} ${devisData.devise}`, pageWidth - 25, yPos + 6, { align: 'right' });
    
    yPos += 8;
  });

  yPos += 5;

  // ============================================
  // TOTALS
  // ============================================
  
  // Subtotal
  doc.setFont('helvetica', 'bold');
  doc.text('Sous-total HT:', pageWidth - 80, yPos);
  doc.text(`${devisData.montant_ht.toLocaleString()} ${devisData.devise}`, pageWidth - 25, yPos, { align: 'right' });
  
  yPos += 7;

  // TVA (if applicable)
  if (devisData.tva && devisData.tva > 0) {
    doc.setFont('helvetica', 'normal');
    doc.text(`TVA (${devisData.tva}%):`, pageWidth - 80, yPos);
    const montantTva = devisData.montant_ttc - devisData.montant_ht;
    doc.text(`${montantTva.toLocaleString()} ${devisData.devise}`, pageWidth - 25, yPos, { align: 'right' });
    yPos += 7;
  }

  // Total TTC
  doc.setFillColor(...primaryColor);
  doc.rect(pageWidth - 90, yPos - 3, 70, 10, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text('TOTAL TTC:', pageWidth - 80, yPos + 4);
  doc.text(`${devisData.montant_ttc.toLocaleString()} ${devisData.devise}`, pageWidth - 25, yPos + 4, { align: 'right' });
  
  yPos += 20;
  doc.setTextColor(...textColor);

  // ============================================
  // CONDITIONS
  // ============================================
  
  if (devisData.delai_execution || devisData.conditions_paiement || devisData.entreprise.conditions_generales) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Conditions:', 20, yPos);
    yPos += 7;
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    if (devisData.delai_execution) {
      doc.text(`• Délai d'exécution: ${devisData.delai_execution}`, 25, yPos);
      yPos += 6;
    }
    
    if (devisData.conditions_paiement) {
      doc.text(`• Conditions de paiement: ${devisData.conditions_paiement}`, 25, yPos);
      yPos += 6;
    }
    
    if (devisData.entreprise.conditions_generales) {
      const lines = doc.splitTextToSize(devisData.entreprise.conditions_generales, pageWidth - 50);
      lines.forEach((line: string) => {
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 20;
        }
        doc.text(`• ${line}`, 25, yPos);
        yPos += 6;
      });
    }
  }

  // ============================================
  // FOOTER - KaziPro Signature
  // ============================================
  
  const footerY = pageHeight - 20;
  
  doc.setDrawColor(200, 200, 200);
  doc.line(20, footerY - 5, pageWidth - 20, footerY - 5);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(120, 120, 120);
  doc.text('Généré via KaziPro - Plateforme de mise en relation professionnelle', pageWidth / 2, footerY, { align: 'center' });
  doc.text('www.kazipro.cd', pageWidth / 2, footerY + 5, { align: 'center' });

  // ============================================
  // SAVE PDF
  // ============================================
  
  const fileName = `Devis_${devisData.numero}_${devisData.client.nom.replace(/\s+/g, '_')}.pdf`;
  doc.save(fileName);
}

// Helper function to load image as base64 (for logo)
export async function loadImageAsBase64(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      } else {
        reject(new Error('Failed to get canvas context'));
      }
    };
    img.onerror = reject;
    img.src = url;
  });
}
