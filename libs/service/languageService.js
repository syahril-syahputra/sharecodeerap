const languageRepository = require("../repositories/language-repository");
const userRepository = require("../repositories/user-repository");
const voiceLanguageRepository = require("../repositories/voiceLanguage-repository");
const Sentry = require("@sentry/node");

const languageService = {

    setUserLanguage: async (user, languageId) => {
        try {
            const language = await languageRepository.getLanguagesById(
                languageId
            );
    
            await userRepository.editLanguageUser(
                user.id,
                languageId,
            );
            return language ;
        } catch(e) {
            console.error(e);
            Sentry.captureException(e);
        }
        

    }

}

module.exports = languageService;