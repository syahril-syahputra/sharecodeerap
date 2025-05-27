require('dotenv-safe').config({allowEmptyValues: true});
const sstk = require("shutterstock-api");
const Sentry = require("@sentry/node");
const s3Service = require("../../libs/service/s3Service");
const poiImageRepository = require("../../libs/repositories/admin/poi-image-repository");

const init = async () => {
    try {
        const sstk = require("shutterstock-api");
        sstk.setAccessToken(process.env.SHUTTERSTOCK_API_TOKEN);

        let imageId = '143306068';

        const imagesApi = new sstk.ImagesApi();
        const body = {
            "images": [
                {
                    "image_id": imageId,
                    "subscription_id": "049927cf01c44e10ba54c27110453fc8",
                    "size": 'medium',
                }
            ]
        };

        let result = await imagesApi.licenseImages(body);

        let data = result.data[0];
        let imageUrl = data.download.url;
        let s3result = await s3Service.downloadImageAndUploadToS3Bucket(imageUrl);

        let image = await poiImageRepository.createPoiImageDB({
            name: s3result.imageFilename,
            publicUrl: s3result.result.Location,
            key: s3result.result.key,
            licenseId: data.license_id,
            shutterstockId: imageId,
        });
        console.log(image);

    } catch (e) {
        console.error(e);
        Sentry.captureException(e);
    }
}
init();


