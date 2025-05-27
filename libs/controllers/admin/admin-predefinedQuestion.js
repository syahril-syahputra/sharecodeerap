const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const questionsService = require("../../service/predefinedQuestionsService");
const { getAllQuestion, createQuestion, updateQuestion, deleteQuestion } = require("../../repositories/admin/predefinedQuestion");
const { getPaginationParameters } = require("../../helpers/pagination");

const adminPredefinedQuestion = {
    fetchQuestion : async (req, res) => {
        try {
            const paginationParameters = getPaginationParameters(req)
            const { q:query, l:languageId, level, a } = req.query
            const result = await getAllQuestion(paginationParameters, query, parseInt(languageId), parseInt(level), parseInt(a))
            render(res, 200, statuscodes.OK, result)
        } catch (e) {
            console.error(e)
            Sentry.captureException(e)
            render(res, 500, statuscodes.INTERNAL_ERROR, {})
        }
    },
    createNewQuestion : async (req, res) => {
        try {
            const result = await createQuestion(req.body)
            render(res, 201, statuscodes.OK, result)
        } catch (e) {
            console.error(e)
            Sentry.captureException(e)
            render(res, 500, statuscodes.INTERNAL_ERROR, {})
        }
    },
    putQuestion : async (req, res) => {
        try {
            const { id } = req.params
            const result = await updateQuestion(parseInt(id),req.body)
            render(res, 200, statuscodes.OK, result)
        } catch (e) {
            console.error(e)
            Sentry.captureException(e)
            render(res, 500, statuscodes.INTERNAL_ERROR, {})
        }
    },
    deletePredefinedQuestion : async (req, res) => {
        try {
            const { id } = req.params
            const result = await deleteQuestion(parseInt(id))
            render(res, 200, statuscodes.OK, result)
        } catch (e) {
            console.error(e)
            Sentry.captureException(e)
            render(res, 500, statuscodes.INTERNAL_ERROR, {})
        }
    },
    generateNewQuestions : async (req, res) => {
        try {
            // console.log(req.body)
            const result = await questionsService.generate4QuestionsPerLanguageTopicAndAgeRange(req.body.topicId, req.body.ageRangeId, req.body.languageId, req.body.prompt);
            render(res, 201, statuscodes.OK, result)
        } catch (e) {
            console.error(e)
            Sentry.captureException(e)
            render(res, 500, statuscodes.INTERNAL_ERROR, {})
        }
    },
}

module.exports = adminPredefinedQuestion