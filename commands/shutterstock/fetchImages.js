require('dotenv-safe').config({allowEmptyValues: true});
const sstk = require("shutterstock-api");
const Sentry = require("@sentry/node");

const init = async () => {
    try {
        const sstk = require("shutterstock-api");

        const applicationClientId = "YHgi3TZKu8MsDBEXGsA1Gz7c6AdaHgmw";
        const applicationClientSecret = "R1ebe1eAABrLFjvA";
        sstk.setBasicAuth(applicationClientId, applicationClientSecret);

        const imagesApi = new sstk.ImagesApi();

        const queryParams = {
            "query": "Lake Toba",
            "image_type": ["photo"],
            "page": 1,
            "per_page": 5,
            "sort": "popular",
            "view": "minimal",
        };

        let result = await imagesApi.searchImages(queryParams);
        console.log(result.data[0]);
    } catch (e) {
        console.error(e);
        Sentry.captureException(e);
    }
}
init();


