const axios = require("axios");
const AWS = require("aws-sdk");
const { parse } = require("url");
const path = require("path");
const fs = require("fs").promises;
const os = require("os");

const downloadImageService = {
    downloadImage: async (url, filename) => {
        const response = await axios.get(url, { responseType: "arraybuffer" });
        await fs.writeFile(filename, response.data);
    },

    uploadToS3: async (bucketName, filePath, s3Key) => {
        const s3 = new AWS.S3();

        const fileContent = await fs.readFile(filePath);

        const params = {
            Bucket: bucketName,
            Key: s3Key,
            Body: fileContent,
            ACL: "public-read",
        };

        return await s3.upload(params).promise();
    },

    downloadImageAndUploadToS3Bucket: async (imageUrl) => {
        try {
            const parsedUrl = parse(imageUrl);
            const filePath = path.join(
                os.tmpdir(),
                path.basename(parsedUrl.pathname)
            );

            await downloadImageService.downloadImage(imageUrl, filePath);
            let result = await downloadImageService.uploadToS3(
                process.env.AWS_S3_BUCKET_IMAGES,
                filePath,
                `image/${path.basename(filePath)}`
            );
            await fs.unlink(filePath);

            return {
                imageFilename: path.basename(filePath),
                result: result,
            };
        } catch (error) {
            console.error("S3 Error uploading image:", error.message);
        }
    },
    uploadS3base64: async (data, key) => {
        try {
            const s3 = new AWS.S3();

            const base64Data = data.replace(/^data:image\/\w+;base64,/, "");

            const buffer = Buffer.from(base64Data, "base64");
            // console.log(process.env.AWS_S3_BUCKET_IMAGES, "from env");
            const params = {
                Bucket: process.env.AWS_S3_BUCKET_IMAGES,
                Key: key,
                Body: buffer,
                ContentType: "image/png",
                ACL: "public-read",
            };

            const result = await s3.upload(params).promise();

            console.log(`PNG image uploaded to: ${result.Location}`);
            return result;
        } catch (e) {
            console.error("S3 Error uploading image:", e.message);
        }
    },
    deleteS3assets: async (key) => {
        const s3 = new AWS.S3();
        const params = {
            Bucket: process.env.AWS_S3_BUCKET_IMAGES,
            Key: key,
        };
        const res = await s3.deleteObject(params).promise();

        console.log(`S3 asset deleted: ${key}`);
        return res;
    },
};
module.exports = downloadImageService;
