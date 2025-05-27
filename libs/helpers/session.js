const Sentry = require("@sentry/node");

const sessionHelper = {

    promptsToDigest: (prompts) => {
        try {
            if(!prompts){
                return "";
            }

            let response = prompts.map(prompt => {
                return "\nHuman: " + prompt.request + "\nAI: " + prompt.response;
            });
            return response;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    cleanJsonResponse: async (jsonString) => {
        let json;

        // check if value is already a JSON object
        if (typeof jsonString === 'object' && jsonString !== null) {
            json = jsonString;
        } else if (typeof jsonString === 'string') {
            // check if value is a string containing JSON
            const match = jsonString.match(/\{.*\}/); // use a regular expression to match anything between the first "{" and last "}"
            if (match) {
                try {
                    json = JSON.parse(match[0]);
                } catch (e) {
                    json = null;
                }
            } else {
                try {
                    json = JSON.parse(jsonString);
                } catch (e) {
                    json = null;
                }
            }
        } else {
            json = null;
        }

        json = sessionHelper.removeEmptyValues(json);

        return json;
    },

    removeEmptyValues: async (obj) => {
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                if (obj[key] === null || obj[key] === undefined || obj[key] === '') {
                    delete obj[key];
                } else if (typeof obj[key] === 'object') {
                    await sessionHelper.removeEmptyValues(obj[key]);
                    if (Object.keys(obj[key]).length === 0) {
                        delete obj[key];
                    }
                }
            }
        }
        return obj;
    }

}

module.exports = sessionHelper;