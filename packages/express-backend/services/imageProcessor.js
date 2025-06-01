import sharp from "sharp";

/**
 * Process uploaded image into thumbnail and large versions.
 * Handle animated GIFs with static thumbnails and preserve original animation.
 */
export async function processImage(
  imageBuffer,
  cropMode = "scale",
  mimeType = ""
) {
  try {
    // Validate input buffer
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error("Invalid image buffer");
    }

    // Clean cropMode parameter to remove whitespace
    const cleanCropMode = cropMode.trim();

    // Determine resize options based on crop mode
    const resizeOptions = {
      crop: {
        fit: "cover",
        position: "center"
      },
      scale: {
        fit: "inside",
        background: { r: 255, g: 255, b: 255, alpha: 1 }
      }
    };

    const finalOptions = resizeOptions[cleanCropMode] || resizeOptions.crop;

    // Handle animated GIFs with static thumbnail and preserved animation
    if (mimeType === "image/gif") {
      // Create static thumbnail from first frame
      const thumbnailBuffer = await sharp(imageBuffer, { pages: 1 })
        .resize(256, 320, finalOptions)
        .webp({ quality: 80 })
        .toBuffer();

      // Return original GIF buffer for animation preservation
      return {
        thumbnail: thumbnailBuffer,
        large: imageBuffer
      };
    }

    // Process static images with WebP conversion
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(256, 320, finalOptions)
      .webp({ quality: 80 })
      .toBuffer();

    const largeBuffer = await sharp(imageBuffer)
      .resize(640, 800, finalOptions)
      .webp({ quality: 85 })
      .toBuffer();

    return {
      thumbnail: thumbnailBuffer,
      large: largeBuffer
    };
  } catch (error) {
    throw new Error(`Image processing failed: ${error.message}`);
  }
}

/**
 * Validate uploaded file meets requirements.
 */
export function validateImageFile(file) {
  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error("Invalid file type. Only JPEG, PNG, WebP, and GIF allowed");
  }

  if (file.size > maxSize) {
    throw new Error("File too large. Maximum size is 10MB");
  }

  return true;
}
