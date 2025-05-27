const Sentry = require("@sentry/node");
const render = require("../helpers/render");
const statuscodes = require("../helpers/statuscodes");
const Joi = require("joi");
const notificationRepository = require("../repositories/notification-repository");

module.exports = {
    getNotifications: async (req, res) => {
        try {
            const notifications = await notificationRepository.getNotifications();
            render(res, 200, statuscodes.OK, notifications);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    getLocalNotifications: async (req, res) => {
        try {
            const notifications = await notificationRepository.getLocalNotifications();
            render(res, 200, statuscodes.OK, notifications);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    updateValueNotificationsTopic: async (req, res) => {
        try {
            const schema = Joi.object({
                id: Joi.number().required(),
                active: Joi.boolean().required(),
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, {});
                return;
            }

            const result = await notificationRepository.followNotificationTopic(req.user, value.id, value.active);

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            if (e.code === 'P2003') {
                render(res, 500, statuscodes.NOT_FOUND, {});
                return
            } else {
                Sentry.captureException(e);
                render(res, 500, statuscodes.INTERNAL_ERROR, {});
                return
            }
        }
    },
    subscribeAllNotificationTopics: async (req, res) => {
        try {
            const schema = Joi.object({
                active: Joi.boolean().required(),
            });
            const { error, value } = schema.validate(req.body);

            const results = await notificationRepository.followOrUnfollowAllNotificationTopic(req.user, value.active);
            render(res, 200, statuscodes.OK, results);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
            return
        }
    },
};
