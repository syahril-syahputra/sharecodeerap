const statuscodes = require('../helpers/statuscodes');
const Sentry = require("@sentry/node");
const render = require('../helpers/render');
const faqRepository = require("../repositories/faq-repository");
const logService = require('../service/logService');
const { LogType } = require('@prisma/client');

module.exports = {

    getAllFAQForLanguage: async (req, res) => {
        try {
            let faqs = await faqRepository.findByLanguage(parseInt(req.params.languageId));
            // await logService.createLog(req, { type : LogType.GET_FAQS, message: `Get all FAQ`})

            render(res, 200, statuscodes.OK, faqs);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

}


