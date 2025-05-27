const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const Joi = require("joi");
const { TTS_TYPE, STT_Type} = require('@prisma/client'); // Assuming you have an enum TTS_TYPE defined in your Prisma client
const SettingsRepository = require("../../repositories/admin/settings-repository");

const adminSettingsController = {

    getSettings:  async (req, res) => {
        try {
            const stripeVisibility = await SettingsRepository.getSettings();
            render(res, 200, statuscodes.OK, stripeVisibility);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    getSettingsByName:  async (req, res) => {
        try {
            const setting = await SettingsRepository.getSettingByName(req.params.type);
            render(res, 200, statuscodes.OK, setting);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    getStripeVisibility:  async (req, res) => {
        try {
            const stripeVisibility = await SettingsRepository.getStripeVisibility();
            render(res, 200, statuscodes.OK, stripeVisibility);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    setStripeVisibility: async (req, res) => {
        try {
            const schema = Joi.object({
                stripeVisibility: Joi.boolean(),
            });
            const {error, value} = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            const stripeVisibility = SettingsRepository.setStripeVisibility(value.stripeVisibility);

            render(res, 200, statuscodes.OK, stripeVisibility);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    setSTT:  async (req, res) => {
        try {

            const schema = Joi.object({
                value: Joi.string().valid(STT_Type.MOBILE_APP, STT_Type.GROQ_WHISPER, STT_Type.DEEPGRAM_API).required(),
            });
            const {error, value} = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, "expected value should be one of 'MOBILE_APP', 'GOOGLE', 'GROQ_WHISPER', 'DEEPGRAM_API'");
                return;
            }

            const setting = await SettingsRepository.setSTT(value.value);
            render(res, 200, statuscodes.OK, setting);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    setTTS:  async (req, res) => {
        try {

            const schema = Joi.object({
                value: Joi.string().valid(TTS_TYPE.MOBILE_APP, TTS_TYPE.GOOGLE, TTS_TYPE.ELEVEN_LABS, TTS_TYPE.DEEPGRAM_API).required(),
                model: Joi.string().optional().allow(null),
                voice: Joi.string().optional().allow(null),
            });
            const {error, value} = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, "expected value should be one of 'MOBILE_APP', 'GOOGLE', 'ELEVEN_LABS', 'DEEPGRAM_API'");
                return;
            }

            const setting = await SettingsRepository.setTTS(value.value, value.voice, value.model);
            render(res, 200, statuscodes.OK, setting);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

}

module.exports = adminSettingsController;