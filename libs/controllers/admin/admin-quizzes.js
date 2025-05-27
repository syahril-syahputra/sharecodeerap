const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const {getPaginationParameters} = require("../../helpers/pagination");
const QuizRepository = require("../../repositories/admin/quiz-repository");

const adminQuizController = {
    getQuizzes:  async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await QuizRepository.getQuizzesByUser(paginationParameters, parseInt(req.params.userId), req.query.search)

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getCompleteQuizzes:  async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await QuizRepository.getCompleteQuizzesByUser(paginationParameters, parseInt(req.params.userId))

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.log(e)
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
}

module.exports = adminQuizController;