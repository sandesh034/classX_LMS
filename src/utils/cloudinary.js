const cloudinary = require('cloudinary').v2;
const fs = require("fs");

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET
});


const uploadImageToCloudinary = async (localfileUrl) => {
    try {
        if (!localfileUrl) return null;
        const response = await cloudinary.uploader.upload(localfileUrl);
        // console.log(response);
        fs.unlinkSync(localfileUrl);
        return response;
    } catch (error) {
        fs.unlinkSync(localfileUrl);
        console.log("Error occured on file upload", error);
        return null;
    }
}

module.exports = uploadImageToCloudinary;