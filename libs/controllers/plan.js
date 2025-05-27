const statuscodes = require('../helpers/statuscodes');
const Sentry = require("@sentry/node");
const render = require('../helpers/render');
const planRepository = require('../repositories/plan-repository');

const planController = {

    getAllPlan: async (req, res) => {
        try {
            let plans = await planRepository.getAllPlan();
            render(res, 200, statuscodes.OK, plans);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

}
module.exports = planController;