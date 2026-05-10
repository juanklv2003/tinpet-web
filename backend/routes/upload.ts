const express = require('express');
const multer = require('multer');
const { v2: cloudinary } = require('cloudinary');
import type { Request, Response } from 'express';
import type { FileFilterCallback } from 'multer';

const router = express.Router();

const cloudinaryConfig = {
  cloud_name:
    process.env.CLOUDINARY_CLOUD_NAME ||
    process.env.CLOUDINARY_CLOUD ||
    process.env.CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || process.env.CLOUD_API_KEY,
  api_secret:
    process.env.CLOUDINARY_API_SECRET ||
    process.env.CLOUD_API_SECRET ||
    process.env.CLOUD_API_KEY_SECRET,
};

cloudinary.config({
  cloud_name: cloudinaryConfig.cloud_name,
  api_key: cloudinaryConfig.api_key,
  api_secret: cloudinaryConfig.api_secret,
});

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req: Request, file: Express.Multer.File, cb: FileFilterCallback) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image files are allowed'));
  },
});

router.post(
  '/',
  upload.single('file'),
  async (req: Request, res: Response) => {
  try {
    if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
      return res.status(500).json({
        error:
          'Cloudinary no configurado en backend. Revisa CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET.',
      });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const fileBuffer = req.file.buffer;

      const result = await new Promise<{ secure_url: string; public_id: string }>((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: 'tinpet/profiles',
            transformation: [
              { width: 400, height: 400, crop: 'fill', gravity: 'face' },
              { quality: 'auto' },
              { fetch_format: 'auto' },
            ],
          },
          (
            error: Error | undefined,
            uploadResult: { secure_url?: string; public_id?: string } | undefined,
          ) => {
            if (error) {
              reject(error);
              return;
            }
            if (!uploadResult?.secure_url || !uploadResult.public_id) {
              reject(new Error('Cloudinary response missing required fields'));
              return;
            }
            resolve({
              secure_url: uploadResult.secure_url,
              public_id: uploadResult.public_id,
            });
          },
        );
        stream.end(fileBuffer);
      });

      return res.json({
        url: result.secure_url,
        public_id: result.public_id,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload image';
      console.error('Upload error:', error);
      return res.status(500).json({ error: message });
    }
  },
);

module.exports = router;
