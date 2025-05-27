const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const {getPaginationParameters} = require("../../helpers/pagination");
const axios = require("axios");

const adminImageController = {
    getImages:  async (req, res) => {
        try {

            const response = await axios.get(`https://api.unsplash.com/search/photos?query=${req.query.topic}`, {
                headers: {
                    'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
                }
            });

            render(res, 200, statuscodes.OK, response.data);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
}

module.exports = adminImageController;