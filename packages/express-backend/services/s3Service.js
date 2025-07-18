import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand
} from "@aws-sdk/client-s3";
import { randomUUID } from "crypto";

const s3Client = new S3Client({
  region: process.env.S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
});

/**
 * Upload both thumbnail and large image versions to S3.
 * Returns URLs for both uploaded files.
 */
export async function uploadImagePair(
  thumbnailBuffer,
  largeBuffer,
  originalMimeType = "image/webp"
) {
  const fileId = randomUUID();
  const bucketName = process.env.S3_BUCKET_NAME;

  // Determine file extension and content type for large image
  const isGif = originalMimeType === "image/gif";
  const largeExtension = isGif ? "gif" : "webp";
  const largeContentType = isGif ? "image/gif" : "image/webp";

  try {
    // Upload thumbnail (always WebP)
    const thumbnailKey = `thumbnails/${fileId}-thumb.webp`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: thumbnailKey,
        Body: thumbnailBuffer,
        ContentType: "image/webp",
        CacheControl: "max-age=31536000" // 1 year cache
      })
    );

    // Upload large image with proper type
    const largeKey = `images/${fileId}-large.${largeExtension}`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: largeKey,
        Body: largeBuffer,
        ContentType: largeContentType,
        CacheControl: "max-age=31536000" // 1 year cache
      })
    );

    // Generate URLs
    const baseUrl = `https://${bucketName}.s3.${process.env.S3_REGION}.amazonaws.com`;

    return {
      thumbnailUrl: `${baseUrl}/${thumbnailKey}`,
      imageUrl: `${baseUrl}/${largeKey}`
    };
  } catch (error) {
    throw new Error(`S3 upload failed: ${error.message}`);
  }
}

/**
 * Upload loss GIF thumbnail and large image versions to dedicated folders.
 * Returns URLs for both uploaded files.
 */
export async function uploadLossGifImagePair(
  thumbnailBuffer,
  largeBuffer,
  originalMimeType = "image/webp"
) {
  const fileId = randomUUID();
  const bucketName = process.env.S3_BUCKET_NAME;

  // Determine file extension and content type for large image
  const isGif = originalMimeType === "image/gif";
  const largeExtension = isGif ? "gif" : "webp";
  const largeContentType = isGif ? "image/gif" : "image/webp";

  try {
    // Upload thumbnail to loss-gifs-thumbnails folder (always WebP)
    const thumbnailKey = `loss-gifs-thumbnails/${fileId}-thumb.webp`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: thumbnailKey,
        Body: thumbnailBuffer,
        ContentType: "image/webp",
        CacheControl: "max-age=31536000" // 1 year cache
      })
    );

    // Upload large image to loss-gifs folder with proper type
    const largeKey = `loss-gifs/${fileId}-large.${largeExtension}`;
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: largeKey,
        Body: largeBuffer,
        ContentType: largeContentType,
        CacheControl: "max-age=31536000" // 1 year cache
      })
    );

    // Generate URLs
    const baseUrl = `https://${bucketName}.s3.${process.env.S3_REGION}.amazonaws.com`;

    return {
      thumbnailUrl: `${baseUrl}/${thumbnailKey}`,
      imageUrl: `${baseUrl}/${largeKey}`
    };
  } catch (error) {
    throw new Error(`S3 upload failed: ${error.message}`);
  }
}

/**
 * Upload single file to S3 (for backward compatibility).
 */
export async function uploadSingleImage(buffer, fileName) {
  const bucketName = process.env.S3_BUCKET_NAME;
  const key = `images/${fileName}`;

  try {
    await s3Client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: key,
        Body: buffer,
        ContentType: "image/webp",
        CacheControl: "max-age=31536000"
      })
    );

    return `https://${bucketName}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`;
  } catch (error) {
    throw new Error(`S3 upload failed: ${error.message}`);
  }
}

/**
 * Delete single image from S3 for cleanup operations.
 */
export async function deleteS3Image(imageUrl) {
  if (!imageUrl) return;

  try {
    // Extract key from full S3 URL
    const url = new URL(imageUrl);
    const key = url.pathname.substring(1); // Remove leading slash

    await s3Client.send(
      new DeleteObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key
      })
    );
  } catch (error) {
    console.error(`Failed to delete S3 object: ${imageUrl}`, error);
    throw error;
  }
}
