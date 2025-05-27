const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const sstk = require("shutterstock-api");
const s3Service = require("../../service/s3Service");
const poiImageRepository = require("../../repositories/admin/poi-image-repository");

const adminImageController = {
    getImages:  async (req, res) => {
        try {

            sstk.setBasicAuth(process.env.SHUTTERSTOCK_KEY, process.env.SHUTTERSTOCK_SECRET);

            const imagesApi = new sstk.ImagesApi();

            const queryParams = {
                "query": req.query.search,
                "image_type": ["photo"],
                "page": req.query.page ?? 1,
                "per_page": req.query.perPage ?? 5,
                "sort": "popular",
                "view": "minimal",
                "orientation": "horizontal"
            };

            let result = await imagesApi.searchImages(queryParams);

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    licenseImage:  async (req, res) => {
        try {

            sstk.setAccessToken(process.env.SHUTTERSTOCK_API_TOKEN);

            let imageId = req.body.image_id;
            const imagesApi = new sstk.ImagesApi();
            const body = {
                "images": [
                    {
                        "image_id": imageId,
                        "subscription_id": process.env.SHUTTERSTOCK_SUBSCRIPTION_ID,
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

            render(res, 200, statuscodes.OK, image);
        } catch (e) {
            console.log(e)
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    // licenseTopic : async (req, res) => {
    //     try {

    //         sstk.setAccessToken(process.env.SHUTTERSTOCK_API_TOKEN);
    //         let imageId = req.body.image_id;
    //         const imagesApi = new sstk.ImagesApi();
    //         const body = {
    //             "images": [
    //                 {
    //                     "image_id": imageId,
    //                     "subscription_id": process.env.SHUTTERSTOCK_SUBSCRIPTION_ID,
    //                     "size": 'medium',
    //                 }
    //             ]
    //         };

    //         let result = await imagesApi.licenseImages(body);
    //         let data = result.data[0];

    //         let imageUrl = data.download.url;
    //         let s3result = await s3Service.downloadImageAndUploadToS3Bucket(imageUrl);

    //         let image = await poiImageRepository.createPoiImageDB({
    //             name: s3result.imageFilename,
    //             publicUrl: s3result.result.Location,
    //             key: s3result.result.key,
    //             licenseId: data.license_id,
    //             shutterstockId: imageId,
    //         });
    //     } catch (e) {
    //         console.error(e);
    //         Sentry.captureException(e);
    //         render(res, 500, statuscodes.DB_ERROR, {});
    //     }
    // }
}

module.exports = adminImageController;