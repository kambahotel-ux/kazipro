import { contratsApi } from '@/lib/api';
import { generateContractPDF, type ContractData } from '@/lib/pdf-generator';

/** Télécharge le PDF contrat généré côté Laravel (DomPDF). */
export async function downloadContratPdfFromApi(
  contratId: string,
  filename?: string,
): Promise<void> {
  const blob = await contratsApi.downloadPdfBlob(contratId);
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename ?? `contrat-${contratId}.pdf`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

/** API Laravel en priorité, repli sur le générateur client si l'API échoue. */
export async function downloadContratPdf(
  contratId: string,
  fallbackData?: ContractData,
  filename?: string,
): Promise<'api' | 'client'> {
  try {
    await downloadContratPdfFromApi(contratId, filename);
    return 'api';
  } catch (apiError) {
    if (!fallbackData) throw apiError;
    await generateContractPDF(fallbackData);
    return 'client';
  }
}
