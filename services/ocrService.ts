/**
 * Bridge to the Server-Side OCR Worker.
 * Offloads heavy document analysis to the backend.
 * 
 * @param fileKey - The path of the file in Supabase Storage.
 * @param documentId - The UUID of the document record in Postgres.
 * @returns {Promise<string>} A confirmation message or extracted text.
 */
export async function triggerServerSideOCR(fileKey: string, documentId: string): Promise<string> {
  try {
    const response = await fetch('/api/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileKey, documentId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Server-side processing failed');
    }

    const result = await response.json();
    return result.extractedText;
  } catch (error: any) {
    console.error('OCR Trigger Error:', error);
    throw new Error('Backend processing failed. Please try again later.');
  }
}