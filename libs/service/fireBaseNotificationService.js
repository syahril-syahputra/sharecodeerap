const { initializeApp, applicationDefault } = require("firebase-admin/app");
const fcm = require("firebase-admin");
const { getMessaging } = require("firebase-admin/messaging");
const key = require("../../eureka-479e7-firebase-adminsdk-y2jjs-bb6527d7a6.json");
const statuscodes = require("../helpers/statuscodes");
const schedule = require("node-schedule");
const moment = require("moment-timezone");
const { updateNotification } = require("../repositories/admin/notification-repository");

initializeApp({
    credential: fcm.credential.cert(key),
    projectId: process.env.FB_PROJECTID,
});
const scheduledJobNames = [];

const fcmNotificationService = {
    sendNotifications: (users, notif) => {
        let result = [];
        users.forEach((user, index) => {
            const userTime = moment.tz(notif.time, user.timezone || 'Asia/Singapore');
            const title = createTitleLanguage(user.languageId, notif);
            const body = createBodyLanguage(user.languageId, notif);
            const jobName = `job-${notif.id}-${index}`;
            scheduledJobNames.push(jobName);
            schedule.scheduleJob(jobName, userTime.toDate(), async () => {
                const message = {
                    notification: {
                        title,
                        body,
                    },
                };
                message.token = user.fcmToken;
                result.push(getMessaging().send(message));
                await updateNotification(notif.id, { sent: true })
            })
        });
        return result;
    },

    cancelScheduledNotifications: async (notificationId) => {
        for (const jobName in schedule.scheduledJobs) {
            if (jobName.startsWith(`job-${notificationId}-`)) {
                const job = schedule.scheduledJobs[jobName];
                if (job) {
                    job.cancel();
                    const index = scheduledJobNames.indexOf(jobName);
                    if (index !== -1) {
                        scheduledJobNames.splice(index, 1);
                    }
                }
            }
        }
    },
};

function createTitleLanguage(languageId, notif) {
    let title;
    switch (languageId) {
        case 23: 
            title = notif.title_ct;
            break;
        case 38: 
            title = notif.title;
            break;
        case 40: 
            title = notif.title_es;
            break;
        case 66: 
            title = notif.title_id;
            break;
        case 48:
            title = notif.title_fr;
            break;
        case 183:
            title = notif.title_cn;
            break;
        default:
            title = notif.title;
            break;
    }
    return title;
}

function createBodyLanguage(languageId, notif) {
    let body;
    switch (languageId) {
        case 23: 
            body = notif.body_ct;
            break;
        case 38: 
            body = notif.body;
            break;
        case 40: 
            body = notif.body_es;
            break;
        case 66: 
            body = notif.body_id;
            break;
        case 48:
            body = notif.body_fr;
            break;
        case 183:
            body = notif.body_cn;
            break;
        default:
            body = notif.body;
            break;
    }
    return body;
}

module.exports = fcmNotificationService;
