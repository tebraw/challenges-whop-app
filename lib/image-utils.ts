// lib/image-utils.ts
/**
 * Image optimization utilities for thumbnails
 * Converts Base64 images to smaller WebP thumbnails
 */

export interface ThumbnailOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

const DEFAULT_OPTIONS: ThumbnailOptions = {
  maxWidth: 400,
  maxHeight: 225,
  quality: 0.75,
  format: 'webp'
};

/**
 * Generate a thumbnail from a base64 data URL
 * Works in Node.js environment using canvas
 */
export async function generateThumbnail(
  dataUrl: string,
  options: ThumbnailOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // If not a data URL, return as-is
  if (!dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  try {
    // Dynamic import for canvas (only in Node.js)
    const { createCanvas, loadImage } = await import('canvas');

    // Load the original image
    const img = await loadImage(dataUrl);

    // Calculate new dimensions while maintaining aspect ratio
    let { width, height } = img;
    const maxWidth = opts.maxWidth!;
    const maxHeight = opts.maxHeight!;

    if (width > maxWidth || height > maxHeight) {
      const ratio = Math.min(maxWidth / width, maxHeight / height);
      width = Math.round(width * ratio);
      height = Math.round(height * ratio);
    }

    // Create canvas and draw resized image
    const canvas = createCanvas(width, height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    // Convert to data URL with specified format and quality
    const mimeType = `image/${opts.format}`;
    const thumbnail = canvas.toDataURL(mimeType, opts.quality);

    console.log('📸 Thumbnail generated:', {
      original: dataUrl.length,
      thumbnail: thumbnail.length,
      reduction: `${Math.round((1 - thumbnail.length / dataUrl.length) * 100)}%`,
      dimensions: `${width}x${height}`
    });

    return thumbnail;
  } catch (error) {
    console.error('Failed to generate thumbnail:', error);
    // Fallback: return original if thumbnail generation fails
    return dataUrl;
  }
}

/**
 * Generate thumbnail safe for browser environment
 * Falls back to original if canvas is not available
 */
export async function generateThumbnailBrowser(
  dataUrl: string,
  options: ThumbnailOptions = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (!dataUrl.startsWith('data:image/')) {
    return dataUrl;
  }

  try {
    // Check if we're in a browser environment
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      // Server-side: return original, will be processed by server
      return dataUrl;
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          let { width, height } = img;
          const maxWidth = opts.maxWidth!;
          const maxHeight = opts.maxHeight!;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width = Math.round(width * ratio);
            height = Math.round(height * ratio);
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl); // Fallback
            return;
          }
          
          ctx.drawImage(img, 0, 0, width, height);
          
          const mimeType = `image/${opts.format}`;
          const thumbnail = canvas.toDataURL(mimeType, opts.quality);
          
          resolve(thumbnail);
        } catch (error) {
          console.error('Canvas error:', error);
          resolve(dataUrl); // Fallback
        }
      };
      
      img.onerror = () => {
        console.error('Image load error');
        resolve(dataUrl); // Fallback
      };
      
      img.src = dataUrl;
    });
  } catch (error) {
    console.error('Thumbnail generation failed:', error);
    return dataUrl; // Fallback
  }
}

/**
 * Check if image size exceeds threshold
 */
export function isImageTooLarge(dataUrl: string, maxSizeKB: number = 500): boolean {
  if (!dataUrl.startsWith('data:image/')) {
    return false;
  }
  
  // Estimate size: base64 is ~33% larger than binary
  // Remove data URL prefix to get just the base64 data
  const base64Data = dataUrl.split(',')[1] || '';
  const sizeKB = (base64Data.length * 0.75) / 1024; // Convert to KB
  
  return sizeKB > maxSizeKB;
}
