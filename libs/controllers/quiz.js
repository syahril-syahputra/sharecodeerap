const statuscodes = require('../helpers/statuscodes');
const Sentry = require("@sentry/node");
const render = require('../helpers/render');
const quizRepository = require("../repositories/quiz-repository");
const {getPaginationParameters} = require("../helpers/pagination");
const quizEntryRepository = require("../repositories/quiz-entry-repository");
const Joi = require("joi");
const logService = require('../service/logService');
const { LogType } = require('@prisma/client');

const quizController = {

    getQuizzes:  async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await quizRepository.getQuizzes(paginationParameters, req.user.id)

            await logService.createLog(req, {type : LogType.GET_QUIZZES, message: `User with id : ${req.user.id} get all quizz`})

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    getQuiz:  async (req, res) => {
        try {

            let quiz = await quizRepository.findOneById(parseInt(req.params.quizId));
            if(!quiz){
                render(res, 400, statuscodes.NOT_FOUND, "Quiz not found");
                return;
            }else if(quiz.userId !== req.user.id){
                render(res, 400, statuscodes.NOT_FOUND, "Quiz not found");
                return;
            }

            await logService.createLog(req, { type: LogType.GET_ONE_QUIZ, message: `Users with id : ${req.user.id} Get one quiz with id : ${req.params.quizId}`} )

            render(res, 200, statuscodes.OK, quiz);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    answer:  async (req, res) => {
        try {

            const schema = Joi.object({
                value: Joi.boolean().required(),
            });

            const {error, value} = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            let quizEntry = await quizEntryRepository.findOneById(parseInt(req.params.quizEntryId));
            if(!quizEntry){
                render(res, 400, statuscodes.NOT_FOUND, "Quiz entry not found");
                return;
            }else if(quizEntry.quiz.userId !== req.user.id){
                render(res, 400, statuscodes.NOT_FOUND, "Quiz entry not found");
                return;
            }else if(quizEntry.isCorrect !== null){
                render(res, 200, statuscodes.OK, "Already replied");
                return;
            }

            let result = await quizEntryRepository.createAnswer(parseInt(req.params.quizEntryId), value.value === quizEntry.correctAnswer);

            // We check if the quiz is finished
            let quiz = await quizRepository.findOneById(quizEntry.quiz.id);
            if(quiz.QuizEntry.filter(quizEntry => quizEntry.isCorrect === null).length === 0){
                await quizRepository.finishQuiz(quiz.id);
            }

            await logService.createLog(req, { type: LogType.ANSWER_QUIZ, message: `User with id : ${req.user.id} Answer the quiz with id : ${req.params.quizEntryId}` })

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getActivitiesListByQuiz : async (req, res) => {
        try {
            
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {})
        }
    }

}
module.exports = quizController;


