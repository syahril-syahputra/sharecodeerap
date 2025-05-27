const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const {getPaginationParameters} = require("../../helpers/pagination");
const {getAllFaqs,  deleteFaqDB, createFaqDB, editFaqDB} = require("../../repositories/admin/faq-repository");

const adminFaqController = {
    createFaq:  async (req, res) => {
        try {
            let result = await createFaqDB(req.body)

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    editFaq:  async (req, res) => {
        try {
            let result = await editFaqDB(req.body, parseInt(req.params.id))
            console.log(result, 'result')
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getFaqs:  async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await getAllFaqs(paginationParameters)

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    deleteFaq:  async (req, res) => {
        try {
            let result = await deleteFaqDB(parseInt(req.params.id));

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
}

module.exports = adminFaqController;