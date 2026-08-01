import cloudinary from "../config/cloudinary.js";
import streamifier from "streamifier";

export const uploadToCloudinary = (buffer, folder = "products") => {
    return new Promise((resolve, reject) => {

        const stream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: "image",
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );

        streamifier.createReadStream(buffer).pipe(stream);

    });
};


export const uploadBannerImages = async (req, res) => {
    try {

        const desktopImage = req.files?.desktopImage?.[0];
        const mobileImage = req.files?.mobileImage?.[0];

        if (!desktopImage || !mobileImage) {
            return res.status(400).json({
                success: false,
                message: "Desktop and Mobile banner images are required."
            });
        }

        // =====================================
        // Upload Desktop Banner
        // =====================================

        const desktopUpload = await cloudinary.uploader.upload(
            desktopImage.path,
            {
                folder: "banners/desktop",
                resource_type: "image"
            }
        );

        // =====================================
        // Upload Mobile Banner
        // =====================================

        const mobileUpload = await cloudinary.uploader.upload(
            mobileImage.path,
            {
                folder: "banners/mobile",
                resource_type: "image"
            }
        );

        // =====================================
        // Response
        // =====================================

        return res.status(200).json({

            success: true,

            message: "Banner images uploaded successfully.",

            desktopImage: desktopUpload.secure_url,

            desktopImagePublicId: desktopUpload.public_id,

            mobileImage: mobileUpload.secure_url,

            mobileImagePublicId: mobileUpload.public_id

        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({

            success: false,

            message: "Failed to upload banner images.",

            error: error.message

        });

    }
};