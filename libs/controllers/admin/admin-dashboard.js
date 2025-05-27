const statuscodes = require('../../helpers/statuscodes');
const Sentry = require("@sentry/node");
const render = require('../../helpers/render');
const ResponseTimeHelper = require('../../helpers/responseTime');
const {PromptType} = require("@prisma/client");

const dash = {
    getDashboard: async (req, res) =>{
        try {
            let LLMAVGTIme = await ResponseTimeHelper.getResponseTimeForDateRangeLLM(PromptType.DEFAULT);
            let STTAVGTime = await ResponseTimeHelper.getResponseTimeForDateRangeSTT(PromptType.DEFAULT);
            let TTSAVGTime = await ResponseTimeHelper.getResponseTimeForDateRangeTTS(PromptType.DEFAULT);
            let defaultTimes = await ResponseTimeHelper.getResponseTimeForDateRangeAndTime(PromptType.DEFAULT);
            let explainMoreTimes = await ResponseTimeHelper.getResponseTimeForDateRangeAndTime(PromptType.EXPLAIN_MORE);
            let funFactsTimes = await ResponseTimeHelper.getResponseTimeForDateRangeAndTime(PromptType.FUN_FACTS);
            let quizTimes = await ResponseTimeHelper.getResponseTimeForDateRangeAndTime(PromptType.QUIZ);
            let storyTimes = await ResponseTimeHelper.getResponseTimeForDateRangeAndTime(PromptType.STORY);
            let factTimes = await ResponseTimeHelper.getResponseTimeForDateRangeAndTime(PromptType.FACT);
            let errorLogsTimes = await ResponseTimeHelper.getErrorLogResponseTimeForDateRangeAndTime()

            render(res, 200, statuscodes.OK, {
                llmavgtime: LLMAVGTIme,
                sttavgtime: STTAVGTime,
                ttsavgtime: TTSAVGTime,
                default: defaultTimes,
                explainMore: explainMoreTimes,
                funFacts: funFactsTimes,
                quiz: quizTimes,
                story: storyTimes,
                fact: factTimes,
                errorLog: errorLogsTimes
            });

        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 404, statuscodes.DB_ERROR, {error: e});
        }

    },

};
module.exports = dash;


