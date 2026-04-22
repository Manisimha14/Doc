import { supabase } from './supabaseClient';

/**
 * Handles the uploading of a file to the designated S3/Supabase Storage bucket.
 * @param file - The File object (e.g., from an input element).
 * @param bucketName - The name of the storage bucket (e.g., 'family-records').
 * @returns {Promise<string>} A promise that resolves with the unique S3 key/path of the uploaded file.
 * @throws {Error} If the upload process fails.
 */
export async function uploadFileToStorage(file: File, bucketName: string): Promise<string> {
  if (!file) {
    throw new Error('No file provided for upload.');
  }

  const storage = supabase.storage;
  
  // Define the path/key for the file (e.g., 'documents/{user_id}/{filename}')
  // For simplicity here, we use a direct unique filename based on time/UUID in a specific directory.
  const filePath = `raw_uploads/${Date.now()}-${file.name}`;

  try {
    // 1. Upload the file to the bucket
    const { data: uploadData, error: uploadError } = await storage.from(bucketName).upload(filePath, file);

    if (uploadError) {
      throw new Error(`Supabase Storage Upload Error: ${uploadError.message}`);
    }

    // 2. Get the public URL or just use the key for database storage
    // We store the private key in the 'documents' table.
    console.log(`File uploaded successfully to path: ${filePath}`);
    return filePath;
  } catch (e) {
    console.error('Error during file upload:', e);
    throw new Error((e as Error).message || 'Failed to upload document.');
  }
}