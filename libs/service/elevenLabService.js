const { default: axios } = require("axios");
const Sentry = require("@sentry/node");

const elevenLabServices = {
    getAvailableVoices: async () => {
        const url = "https://api.elevenlabs.io/v1/voices";
        try {
            const response = await axios.get(url, {
                headers: {
                    'xi-api-key': process.env.ELEVAN_LAB_API_KEY
                }
            });
            return response.data.voices;
        } catch (e) {
            console.error("error_getting_voices_elevenlabs", e.response.data);
            Sentry.captureException(e);
    
            // Check if the error is due to exceeding the quota
            if (e.response && e.response.data && e.response.data.detail && e.response.data.detail.status === 'quota_exceeded') {
                return {
                    'success': false,
                    'error': {
                        'status': 'quota_exceeded',
                        'message': e.response.data.detail
                    }
                };
            } else {
                // Return a generic error response for other types of errors
                return {
                    'success': false,
                    'error': e.message || 'An unexpected error occurred.',
                    'message': e.response.status == 401 ? e.message : 'Token already reach the limit' 
                };
            }
        }
    },
    getAvailableModels: async () => {
        const url = "https://api.elevenlabs.io/v1/models";
        try {
            const responseModel = await axios.get(url, {
                headers: {
                    'xi-api-key': process.env.ELEVAN_LAB_API_KEY
                }
            });
            return responseModel.data;
        } catch (e) {
            console.error("error_getting_model_elevenlabs", e.response.data);
            Sentry.captureException(e);
    
            // Check if the error is due to exceeding the quota
            if (e.response && e.response.data && e.response.data.detail && e.response.data.detail.status === 'quota_exceeded') {
                return {
                    'success': false,
                    'error': {
                        'status': 'quota_exceeded',
                        'message': e.response.data.detail
                    }
                };
            } else {
                // Return a generic error response for other types of errors
                return {
                    'success': false,
                    'error': e.message || 'An unexpected error occurred.',
                    'message': e.response.status == 401 ? e.message : 'Token already reach the limit' 
                };
            }
        }
    },
    processTts: async (voiceId, text, modelId) => {
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_22050_32`;
        try {
            let data = {
                text: text,
                model_id: modelId,
            }

            const response = await axios.post(url, data, {
                responseType: 'stream',
                headers: {
                    'xi-api-key': process.env.ELEVAN_LAB_API_KEY,
                    'Content-Type': 'application/json',
                }
            });

            return {
                'success' : true,
                'response': response
            };
        } catch (e) {
            console.error("error service tts", e.response.data);
            Sentry.captureException(e);
    
            // Check if the error is due to exceeding the quota
            if (e.response && e.response.data && e.response.data.detail && e.response.data.detail.status === 'quota_exceeded') {
                return {
                    'success': false,
                    'error': {
                        'status': 'quota_exceeded',
                        'message': e.response.data.detail
                    }
                };
            } else {
                // Return a generic error response for other types of errors
                return {
                    'success': false,
                    'error': e.message || 'An unexpected error occurred.',
                    'message': e.response.status == 401 ? e.message : 'Token already reach the limit' 
                };
            }
        }
    },
    isTokenLimitExceeded: async () => {
        const url = 'https://api.elevenlabs.io/v1/user';
        try {
            const response = await axios.get(url, {
                headers: {
                    'xi-api-key': process.env.ELEVAN_LAB_API_KEY,
                    'Content-Type': 'application/json',
                }
            });
            if (response.data && response.data.subscription && response.data.subscription.character_limit) {
                const characterLimit = response.data.subscription.character_limit - 500;
                const characterCount = response.data.subscription.character_count;

                return characterCount >= characterLimit;
            } else {
                throw new Error('Invalid response structure');
            }
        } catch (e) {
            console.error("Error checking token limit", e.response?.data || e.message);
            Sentry.captureException(e);
            return false;
        }
    }
};

module.exports = elevenLabServices;
