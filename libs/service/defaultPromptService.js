const Sentry = require("@sentry/node");
const defaultPromptRepository = require("../repositories/default-prompt-repository");
const dateHelper = require("../helpers/datehelper");

const defaultPromptService = {

    // Receives one user, and given their attributes we pick the closest initial prompt for him/her
    // This function will evolve on time, right now is only a quick approach.
    // Something simple for now is to check if we have anything by age range, and language, if we have we select
    // If we don't have we check by language, if there is any, we pick the closest one
    // Otherwise we check the age range only
    // Otherwise we select the first one

    inferPromptForUser: async (user) => {
        try {
            let defaultPrompt;
            if(user.birthday && user.languageId){
                let age = dateHelper.calculateAge(user.birthday);
                defaultPrompt = await defaultPromptRepository.getDefaultPromptByAgeAndLanguage(user.languageId, age);
                if(!defaultPrompt){
                    defaultPrompt = await defaultPromptRepository.getDefaultPromptByLanguage(user.languageId);
                    if(!defaultPrompt){
                        defaultPrompt = await defaultPromptRepository.getDefaultPromptByAge(age);
                        if(!defaultPrompt){
                            defaultPrompt = await defaultPromptRepository.getDefaultPrompt();
                        }
                    }
                }
                
            }else if(user.birthday){
                let age = dateHelper.calculateAge(user.birthday);
                defaultPrompt = await defaultPromptRepository.getDefaultPromptByAge(age);
                if(!defaultPrompt){
                    defaultPrompt = await defaultPromptRepository.getDefaultPrompt();
                }
            }else if(user.languageId){
                defaultPrompt = await defaultPromptRepository.getDefaultPromptByLanguage(user.languageId);
                if(!defaultPrompt){
                    defaultPrompt = await defaultPromptRepository.getDefaultPrompt();
                }
            }else{
                defaultPrompt = await defaultPromptRepository.getDefaultPrompt();
            }

            return defaultPrompt;

        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

}
module.exports = defaultPromptService;
