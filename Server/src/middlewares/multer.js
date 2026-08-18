import multer from "multer";

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {

    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Only image files are allowed."), false);
    }

};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100 MB
        fieldSize: 100 * 1024 * 1024  // 100 MB
    }
});

export default upload;