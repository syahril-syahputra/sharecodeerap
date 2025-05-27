require('dotenv-safe').config({allowEmptyValues: true});
const sstk = require("shutterstock-api");
const Sentry = require("@sentry/node");

const init = async () => {
    try {
        const sstk = require("shutterstock-api");

        // const applicationClientId = "YHgi3TZKu8MsDBEXGsA1Gz7c6AdaHgmw";
        // const applicationClientSecret = "R1ebe1eAABrLFjvA";
        // sstk.setBasicAuth(applicationClientId, applicationClientSecret);
        sstk.setAccessToken(process.env.SHUTTERSTOCK_API_TOKEN);

        const imagesApi = new sstk.ImagesApi();

        const licenseId = "e12c6ccd61bed0cd18bde374a2b786a58b"; // license ID, not image ID

        const body = {
            "size": "huge"
        };

        let result = await imagesApi.downloadImage(licenseId, body);
        console.log(result)

    } catch (e) {
        console.error(e);
        Sentry.captureException(e);
    }
}
init();


