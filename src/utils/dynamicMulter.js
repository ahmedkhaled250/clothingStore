import multer from "multer";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const fileValidation = {
    image: ["image/jpeg", "image/png", "image/gif"],
    file: ["application/pdf", "application/msword"],
    video: ["video/mp4"],
};

export const dynamicMulter = (customValidation = fileValidation.image) => {
    const storage = multer.diskStorage({
        destination: function (req, file, cb) {
            const uploadDir = join(process.cwd(), 'uploads');
            if (!existsSync(uploadDir)) {
                mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        },
        filename: function (req, file, cb) {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, uniqueSuffix + '-' + file.originalname);
        }
    });

    const fileFilter = (req, file, cb) => {
        if (customValidation.includes(file.mimetype)) {
            return cb(null, true);
        }
        return cb(new Error("In-valid format", { cause: 400 }), false);
    };

    const upload = multer({
        fileFilter,
        storage,
        limits: {
            fileSize: 5 * 1024 * 1024 // 5MB limit
        }
    });
    return upload;
}; 