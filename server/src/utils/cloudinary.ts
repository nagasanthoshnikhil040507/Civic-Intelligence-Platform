import { v2 as cloudinary } from 'cloudinary';
import { ApiError } from './ApiError';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || '12345',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'abcde',
});

export class CloudinaryUtils {
  static async uploadBuffer(buffer: Buffer, folder: string = 'complaints'): Promise<any> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder },
        (error, result) => {
          if (error) return reject(new ApiError(500, 'Cloudinary upload failed'));
          resolve(result);
        }
      );
      uploadStream.end(buffer);
    });
  }

  static async deleteImage(publicId: string): Promise<any> {
    try {
      return await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      throw new ApiError(500, 'Failed to delete image from Cloudinary');
    }
  }
}
