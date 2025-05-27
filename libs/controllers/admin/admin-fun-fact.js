const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const {
    getPromptFunFact,
} = require("../../repositories/admin/fun-fact-repository");

const adminFunFact = {
    getPromptFunFact: async (req, res) => {
        try {
            const { promptId } = req.params;

            const funFact = await getPromptFunFact(parseInt(promptId));

            render(res, 200, statuscodes.OK, funFact);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
};

module.exports = adminFunFact