const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const { getPaginationParameters } = require("../../helpers/pagination");
const {
    getAllNotifications,
    createNotification,
    deleteNotification,
    updateNotification,
    findOneNotification,
    getNotificationByTopicId,
    getNotificationsTopic,
    deleteNotificationTopic,
    createNewNotificationsTopic,
    updateNotificationTopicById,
    createManyNotifications,
} = require("../../repositories/admin/notification-repository");
const fcmNotificationService = require("../../service/fireBaseNotificationService");
const render = require("../../helpers/render");
const userRepository = require("../../repositories/admin/user-repository");
const fs = require("fs");
const csv = require("fast-csv");
const dayjs = require("dayjs");

module.exports = {
    getNotificationsPaginated: async (req, res) => {
        try {
            const pagination = getPaginationParameters(req);
            const result = await getAllNotifications(pagination);

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    createNotifications: async (req, res) => {
        try {
            const result = await createNotification(req.body);
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    deleteNotifications: async (req, res) => {
        try {
            const result = await deleteNotification(
                parseInt(req.params.id),
                req.body
            );
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    updateNotifications: async (req, res) => {
        try {
            const result = await updateNotification(
                parseInt(req.params.id),
                req.body
            );
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    sendNotifications: async (req, res) => {
        try {
            const notif = await findOneNotification(parseInt(req.params.id));
            const users = await userRepository.getUserFCMTokens(notif.notificationTopicId);
            const result =  fcmNotificationService.sendNotifications(
                users,
                notif
            );
            await updateNotification(parseInt(req.params.id), { scheduled: true});
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    cancelScheduledNotification: async (req, res) => {
        try {
            const notif = await findOneNotification(parseInt(req.params.id));
            const result = fcmNotificationService.cancelScheduledNotifications(notif.id);
            await updateNotification(notif.id, { scheduled: false });
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    getNotificationsTopic: async (req, res) => {
        try {
            const result = await getNotificationsTopic();

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    getDetailNotificationTopic: async (req, res) => {
        try {
            const result = await getNotificationByTopicId(
                parseInt(req.params.id)
            );
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    deleteNotificationsTopic: async (req, res) => {
        try {
            const result = await deleteNotificationTopic(
                parseInt(req.params.id)
            );

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    createNotificationsTopic: async (req, res) => {
        try {
            const result = await createNewNotificationsTopic(req.body);
            render(res, 201, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    updateNotificationsTopic: async (req, res) => {
        try {
            const result = await updateNotificationTopicById(
                parseInt(req.params.id),
                req.body
            );

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    uploadNotificationsCSV: async (req, res) => {
        try {
            if (req.file == undefined) {
                render(res, 400, statuscodes.FILE_MISSING, {});
            }
            const topicId = parseInt(req.params.id);
            let notifications = [];
            let path = "../uploads/" + req.file.filename;
        
            fs.createReadStream(path)
                .pipe(csv.parse({ headers: true, delimiter: ';' }))
                .on("error", (error) => {
                    render(res, 500, statuscodes.FILE_ERROR, error);
                })
                .on("data", (row) => {
                    const time = dayjs(row.time);
                    row.time = time.toDate();
                    row.notificationTopicId = topicId;
                    notifications.push(row);
                })
                .on("end", async () => {
                    const result = await createManyNotifications(notifications);
                    fs.unlink(path, (err) => {
                        if (err) {
                            console.log("unlink failed", err);
                        } else {
                            console.log("file deleted");
                        }
                    });
                    render(res, 200, statuscodes.OK, result);
                });

        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
};
