export interface PresignedUrlResponse {
  uploadUrl: string;
  fileKey: string;
  publicUrl: string;
}

export interface PresignedUrlRequest {
  fileName: string;
  fileType: string;
  fileSize: number;
}

// Request a presigned upload URL from the backend
export async function getPresignedUploadUrl({ fileName, fileType, fileSize }: PresignedUrlRequest): Promise<PresignedUrlResponse> {
  const API_URL = import.meta.env.VITE_S3_UPLOAD_API_URL as string;
  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileName, fileType, fileSize }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || "Failed to get presigned URL");
    }
    if (!data.uploadUrl || !data.publicUrl) {
      throw new Error("Invalid response from server");
    }
    return data as PresignedUrlResponse;
  } catch (error: any) {
    throw new Error(error.message || "Network error while getting presigned URL");
  }
}

// Upload the file to S3 using the presigned URL
export async function uploadFileToS3(uploadUrl: string, file: File, fileType: string): Promise<void> {
  try {
    const res = await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": fileType },
      body: file,
    });
    if (!res.ok) {
      throw new Error("Failed to upload file to S3");
    }
  } catch (error: any) {
    throw new Error(error.message || "Network error while uploading to S3");
  }
}
