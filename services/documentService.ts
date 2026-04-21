import { supabase } from '../lib/supabaseClient';

/**
 * Uploads a document to Supabase Storage and saves its metadata to the database.
 * 
 * @param file - The raw file to upload.
 * @param metadata - Metadata including owner_name, doc_type, and group_id.
 * @param content - The extracted text content (usually from OCR).
 * @returns {Promise<any>} The saved document record.
 */
export async function uploadAndIndexDocument(
  file: File, 
  metadata: { owner_name: string; doc_type: string; group_id: string; metadata_json?: any },
  content: string = ''
) {
  try {
    // 1. Upload to Supabase Storage
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
    const filePath = `${metadata.group_id}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('family_vault')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    // 2. Save metadata to 'documents' table
    const { data, error: dbError } = await supabase
      .from('documents')
      .insert([{
        group_id: metadata.group_id,
        owner_name: metadata.owner_name,
        doc_type: metadata.doc_type,
        file_path: filePath,
        raw_content_vector: content,
        metadata_json: metadata.metadata_json || {},
        upload_date: new Date().toISOString()
      }])
      .select()
      .single();

    if (dbError) throw dbError;

    return data;
  } catch (error) {
    console.error('Error in uploadAndIndexDocument:', error);
    throw error;
  }
}

/**
 * Fetches all documents for a specific family group.
 */
export async function getDocumentsByGroup(groupId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('group_id', groupId)
    .order('upload_date', { ascending: false });

  if (error) throw error;
  return data;
}

export async function deleteDocument(documentId: string, filePath: string) {
  // 1. Delete from Storage
  const { error: storageError } = await supabase.storage
    .from('family_vault')
    .remove([filePath]);
  
  if (storageError) throw storageError;

  // 2. Delete from Database
  const { error: dbError } = await supabase
    .from('documents')
    .delete()
    .eq('document_id', documentId);
  
  if (dbError) throw dbError;
}

/**
 * Generates a temporary signed URL for a stored document (expires in 5 mins).
 */
export async function getDocumentSignedUrl(filePath: string) {
  const { data, error } = await supabase.storage
    .from('family_vault')
    .createSignedUrl(filePath, 300); // 5 minute expiry for maximum security
  
  if (error) throw error;
  return data.signedUrl;
}

/**
 * Generates a public URL (Keep for non-sensitive thumbnails if needed, 
 * but we'll prefer signed for full security)
 */
export function getDocumentPublicUrl(filePath: string) {
  const { data } = supabase.storage
    .from('family_vault')
    .getPublicUrl(filePath);
  
  return data.publicUrl;
}