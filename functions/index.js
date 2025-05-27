const { onRequest } = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const {
    onNewFatalIssuePublished,
} = require("firebase-functions/v2/alerts/crashlytics");
const func = require("firebase-functions/v2");
const { default: axios } = require("axios");
const key = require("./serviceAccount/eureka-479e7-firebase-adminsdk-y2jjs-bb6527d7a6.json");
admin.initializeApp({
    credential: admin.credential.cert(key),
    projectId: "eureka-479e7",
});
func.eventarc.onCustomEventPublished("google.firebase.firebasealerts.alerts.v1.published", exports.crashlyticsTrigger);
exports.crashlyticsTrigger = onNewFatalIssuePublished(async (event) => {
    const appId = event.appId;
    const { id, title, subtitle, appVersion } = event.data.payload.issue; // Use payload property
    const message = `
🚨 New fatal issue for ${appId} in version ${appVersion} 🚨

**${title}**

${subtitle}

id: \`${id}\`
`;

    try {
        const domain = [
            "https://api.hi-eureka.com/crashlytics",
            "https://eureka-api-staging.mediatropy.com/crashlytics",
        ];

        for (let e = 0; e < domain.length; e++) {
            const el = domain[e];

            const response = await axios.post(el, {
                message,
            });

            console.log(response);
        }

        logger.info("Successfully sent crashlytics notification to Mattermost! with AppId: " + appId);
    } catch (e) {
        logger.error(`Error while sending crashlytics notification to Mattermost! with AppId: ${appId}`);
        console.error(e);
    }
});