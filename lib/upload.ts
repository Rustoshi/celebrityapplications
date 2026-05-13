/**
 * Client-side Cloudinary upload using an unsigned upload preset.
 * No API secret is exposed — uses the public cloud name and preset name.
 */

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
}

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!;

/**
 * Upload a single file to Cloudinary from the browser.
 * @param file - File object or base64 data URI string
 * @param folder - Cloudinary folder path (e.g. "celebrities/profiles")
 */
export async function uploadToCloudinary(
  file: File | string,
  folder: string
): Promise<CloudinaryUploadResult> {
  const formData = new FormData();

  if (typeof file === "string") {
    formData.append("file", file);
  } else {
    formData.append("file", file);
  }

  formData.append("upload_preset", UPLOAD_PRESET);
  formData.append("folder", `celebconnect/${folder}`);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || "Image upload failed");
  }

  const data = await res.json();

  return {
    url: data.secure_url,
    publicId: data.public_id,
    width: data.width,
    height: data.height,
    format: data.format,
  };
}

/**
 * Upload multiple files to Cloudinary from the browser.
 */
export async function uploadMultipleToCloudinary(
  files: File[],
  folder: string
): Promise<CloudinaryUploadResult[]> {
  return Promise.all(files.map((f) => uploadToCloudinary(f, folder)));
}
