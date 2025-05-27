const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");

const voiceLanguageRepository = {
    getAll : async ( ) => {
        try {
            const voice = await prisma.voiceLanguage.findMany({
                where : {
                    default : true
                }
            })

            return voice
        } catch (e) {
            console.error(e)
            Sentry.captureException(e)
        }
    },
    getDefault : async () => {
        try {
            const voice = await prisma.voiceLanguage.findFirst({
                where : { 
                    default : true
                 }
            })
            return voice
        } catch (e) {
            console.error(e)
            Sentry.captureException(e)
        }
    },
    getDefaultByLanguage : async (languageCode) => {
        try {
            let code;
            if(languageCode === 'zh') code = 'cmn'
            else code = languageCode

            const voiceModel = await prisma.voiceLanguage.findFirst({
                where : {
                    language_code : code,
                    default : true
                }
            })

            return voiceModel;
        } catch (e) {
            console.error(e)
            Sentry.captureException(e)
        }
    },
    getUsedOpenAiTTSVoiceModel : async () => {
        try {
            let result = await prisma.openAiTTSModel.findFirst({
                where : {
                    inUse : true
                }
            })

            return result;
        } catch (e) {
            console.error(e)
            Sentry.captureException(e)
        }
    },

    getVoiceByIso: async (iso) => {
        try {
            const voice = await prisma.voiceLanguage.findMany({
                where : {
                    language_code: iso
                }
            })

            return voice
        } catch (e) {
            console.error(e)
            Sentry.captureException(e)
        }
    }
 }

module.exports = {...voiceLanguageRepository}