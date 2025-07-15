import { getPresignedUploadUrl, uploadFileToS3 } from "../api/s3UploadApi";

/**
 * Handles the full upload flow:
 * 1. Requests a presigned URL from the backend.
 * 2. Uploads the file to S3 using the presigned URL.
 * 3. Returns the public URL of the uploaded file.
 *
 * @param file - The file to upload.
 * @returns The public URL of the uploaded file.
 */
export async function uploadFileWithPublicUrl(file: File): Promise<string> {
  const { uploadUrl, publicUrl } = await getPresignedUploadUrl({
    fileName: file.name,
    fileType: file.type,
    fileSize: file.size,
  });

  await uploadFileToS3(uploadUrl, file, file.type);

  return publicUrl;
}
