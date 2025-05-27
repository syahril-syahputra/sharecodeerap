const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const redis = require("../../lib-ioredis");

module.exports = firebaseWebhook = async (req, res) => {
    try {
        await redis.publish("mattermost:crashlytics", JSON.stringify(req.body));

        render(res, 200, statuscodes.OK, {});
    } catch (error) {
        render(res, 500, statuscodes.INTERNAL_ERROR, {
            message: "Something went wrong, Internal Server Error",
        });
        console.log(error);
    }
};
