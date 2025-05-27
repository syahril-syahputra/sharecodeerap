const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const {getPaginationParameters} = require("../../helpers/pagination");
const {getAllCountries} = require("../../repositories/admin/country-repository");

const adminCountryController = {

    getCountries:  async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await getAllCountries(paginationParameters)

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

}

module.exports = adminCountryController;