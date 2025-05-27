const engineRepository = require("../repositories/admin/engine-repository");
const PromptRepository = require("../repositories/admin/prompt-repository");
const errorlogRepository = require("../repositories/error-log-repository");
const DateHelper = require("./datehelper");
const responseTime = {

    getResponseTimeForDateRangeLLM: async (type) => {
        const listLLM = await engineRepository.getAllEngines()
        const result = []

        for (const engine of listLLM.engines) {
            let dateRanges = DateHelper.lastWeekRanges();

            for (let i = 0; i < dateRanges.length; i++) {
                let responseTime = await PromptRepository.getResponseTimeInTimeRangeByLLM(dateRanges[i].startDate, dateRanges[i].endDate, type, engine.model);

                dateRanges[i].value = responseTime;
            }
            const temp = {
                name : engine.model,
                data : dateRanges
            }
            result.push(temp)
        }

        return result
    },
    getResponseTimeForDateRangeSTT: async (type) => {
        const listSTT = [
            "MOBILE_APP",
            "GROQ_WHISPER",
            "DEEPGRAM_API",
        ]
        const result = []

        for (const engine of listSTT) {
            let dateRanges = DateHelper.lastWeekRanges();

            for (let i = 0; i < dateRanges.length; i++) {
                let responseTime = await PromptRepository.getResponseTimeInTimeRangeBySTT(dateRanges[i].startDate, dateRanges[i].endDate, type, engine);

                dateRanges[i].value = responseTime;
            }
            const temp = {
                name : engine,
                data : dateRanges
            }
            result.push(temp)
        }

        return result
    },
    getResponseTimeForDateRangeTTS: async (type) => {
        const listTTS = [
            "MOBILE_APP",
            "GROQ_WHISPER",
            "GOOGLE",
            "DEEPGRAM_API",
        ]
        const result = []

        for (const engine of listTTS) {
            let dateRanges = DateHelper.lastWeekRanges();

            for (let i = 0; i < dateRanges.length; i++) {
                let responseTime = await PromptRepository.getResponseTimeInTimeRangeByTTS(dateRanges[i].startDate, dateRanges[i].endDate, type, engine);

                dateRanges[i].value = responseTime;
            }
            const temp = {
                name : engine,
                data : dateRanges
            }
            result.push(temp)
        }

        return result
    },

    getResponseTimeForDateRangeAndTime: async (type) => {

        let dateRanges = DateHelper.lastWeekRanges();

        for (let i = 0; i < dateRanges.length; i++) {
            let responseTime = await PromptRepository.getResponseTimeInTimeRange(dateRanges[i].startDate, dateRanges[i].endDate, type);
            dateRanges[i].value = responseTime;
        }
        return dateRanges;
    },

    getErrorLogResponseTimeForDateRangeAndTime: async () => {

        let dateRanges = DateHelper.lastWeekRanges();

        for (let i = 0; i < dateRanges.length; i++) {
            let responseTime = await errorlogRepository.getResponseTimeInTimeRange(dateRanges[i].startDate, dateRanges[i].endDate)
            dateRanges[i].value = responseTime;
        }
        console.log(dateRanges)
        return dateRanges;
    },
}
module.exports = responseTime;