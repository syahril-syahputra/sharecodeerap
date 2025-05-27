const { pushFcmNotifications, getNotifications, updateValueNotificationsTopic, getLocalNotifications, subscribeAllNotificationTopics,  } = require("../libs/controllers/notifications");
const { auth } = require("../libs/middleware/lib-auth");

module.exports = require("express")
    .Router()
    .get('/local', async (req, res) => {
        await getLocalNotifications(req, res);
    })

    .use(auth)
    .get('/', async (req, res) => {
        await getNotifications(req, res);
    })
    .post("/", async (req, res) => {
        await updateValueNotificationsTopic(req, res);
    })
    .post("/all", async (req, res) => {
        await subscribeAllNotificationTopics(req, res);
    });
