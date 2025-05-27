import sharp from "sharp";

/**
 * Process uploaded image into thumbnail and large versions.
 * Creates optimized WebP images with configurable crop mode.
 */
export async function processImage(imageBuffer, cropMode = "scale") {
  try {
    // Validate input buffer
    if (!imageBuffer || imageBuffer.length === 0) {
      throw new Error("Invalid image buffer");
    }

    // Clean the cropMode parameter to remove any whitespace
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

    // Create thumbnail version (256x320, 4:5 ratio)
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(256, 320, finalOptions)
      .webp({ quality: 80 })
      .toBuffer();

    // Create large version (640x800, 4:5 ratio)
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
  const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.mimetype)) {
    throw new Error("Invalid file type. Only JPEG, PNG, and WebP allowed");
  }

  if (file.size > maxSize) {
    throw new Error("File too large. Maximum size is 10MB");
  }

  return true;
}
