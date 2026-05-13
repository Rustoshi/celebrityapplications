import { v2 as cloudinary } from "cloudinary";

/** Configure Cloudinary with environment variables */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/** Result interface for image upload operations */
export interface UploadResult {
  url: string;
  publicId: string;
  width?: number;
  height?: number;
  format?: string;
}

/**
 * Uploads an image to Cloudinary from a base64 string or URL.
 * @param file - Base64 encoded image string or URL
 * @param folder - Cloudinary folder path to store the image
 * @returns Object containing the secure URL and public ID
 */
export async function uploadImage(
  file: string,
  folder: string
): Promise<UploadResult> {
  try {
    const result = await cloudinary.uploader.upload(file, {
      folder: `celebconnect/${folder}`,
      resource_type: "image",
      transformation: [
        { quality: "auto:best" },
        { fetch_format: "auto" },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    throw new Error("Failed to upload image to Cloudinary");
  }
}

/**
 * Deletes an image from Cloudinary by its public ID.
 * @param publicId - The public ID of the image to delete
 * @returns Boolean indicating success
 */
export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    throw new Error("Failed to delete image from Cloudinary");
  }
}

/**
 * Uploads multiple images to Cloudinary.
 * @param files - Array of base64 encoded image strings or URLs
 * @param folder - Cloudinary folder path to store the images
 * @returns Array of upload results
 */
export async function uploadMultipleImages(
  files: string[],
  folder: string
): Promise<UploadResult[]> {
  const uploadPromises = files.map((file) => uploadImage(file, folder));
  return Promise.all(uploadPromises);
}

/**
 * Generates a Cloudinary URL with transformations.
 * @param publicId - The public ID of the image
 * @param options - Transformation options
 * @returns Transformed image URL
 */
export function getImageUrl(
  publicId: string,
  options?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
  }
): string {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      {
        width: options?.width,
        height: options?.height,
        crop: options?.crop || "fill",
        quality: options?.quality || "auto:best",
        fetch_format: "auto",
      },
    ],
  });
}

export { cloudinary };
export default cloudinary;
