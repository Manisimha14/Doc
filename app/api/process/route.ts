import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createWorker } from 'tesseract.js';
import pdfParse from 'pdf-parse';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

/**
 * API Route: /api/process
 * Downloads the file from storage, runs real OCR (images) or text extraction (PDFs),
 * then saves the result back to the documents table.
 */
export async function POST(req: NextRequest) {
  try {
    // 0. Auth Check: Ensure only authenticated users can trigger processing
    const authHeader = req.headers.get('Authorization');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(authHeader?.split(' ')[1] || '');
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Processing requires a valid session.' }, { status: 401 });
    }

    const { fileKey, documentId } = await req.json();

    if (!fileKey || !documentId) {
      return NextResponse.json({ error: 'Missing fileKey or documentId' }, { status: 400 });
    }

    // 1. Download from Supabase Storage
    const { data: fileData, error: downloadError } = await supabaseAdmin
      .storage
      .from('family_vault')
      .download(fileKey);

    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'Failed to download file' }, { status: 500 });
    }

    const buffer = Buffer.from(await fileData.arrayBuffer());
    const ext = fileKey.split('.').pop()?.toLowerCase() || '';
    let extractedText = '';

    // 2. Extract text based on file type
    if (ext === 'pdf') {
      // ── PDF: extract embedded text ─────────────────────────────────────
      try {
        const parsed = await pdfParse(buffer);
        extractedText = parsed.text?.trim() || '';
      } catch (pdfErr) {
        console.error('PDF parse error:', pdfErr);
        extractedText = '';
      }
    } else if (['jpg', 'jpeg', 'png', 'webp', 'bmp', 'tiff', 'tif'].includes(ext)) {
      // ── Image: run Tesseract OCR ────────────────────────────────────────
      try {
        const worker = await createWorker('eng', 1, { logger: () => {} });
        const { data } = await worker.recognize(buffer);
        await worker.terminate();
        extractedText = data.text?.trim() || '';
      } catch (ocrErr) {
        console.error('OCR error:', ocrErr);
        extractedText = '';
      }
    }

    // 3. Clean up extracted text
    extractedText = extractedText
      .replace(/\r\n/g, '\n')
      .replace(/\n{3,}/g, '\n\n')       // collapse excess blank lines
      .replace(/[^\S\n]+/g, ' ')        // collapse inline whitespace
      .trim();

    // 4. Fallback if no text could be extracted
    if (!extractedText) {
      extractedText = `[No readable text found in this ${ext.toUpperCase()} document. The file has been securely archived.]`;
    }

    // 5. Save to database
    const { error: updateError } = await supabaseAdmin
      .from('documents')
      .update({ raw_content_vector: extractedText })
      .eq('document_id', documentId);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update document index' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'Document processed and indexed.',
      extractedText,
    });

  } catch (error: any) {
    console.error('Process route error:', error);
    return NextResponse.json({ error: 'Internal server error during processing' }, { status: 500 });
  }
}
