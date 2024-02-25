import multer from "multer";
export const fileValidation = {
  image: ["image/jpeg", "image/png", "image/gif"],
  file: ["application/pdf", "application/msword"],
  video: ["video/mp4"],
};
export const myMulter = (customValidation = fileValidation.image) => {
  const storage = multer.diskStorage({});
  const fileFilter = (req, file, cb) => {
    if (customValidation.includes(file.mimetype)) {
      return cb(null, true);
    }
    return cb(new Error("In-valid format", { cause: 400 }), false);
  };

  const upload = multer({ fileFilter, storage });
  return upload;
};
