const {
    getNotificationsPaginated,
    createNotifications,
    updateNotifications,
    deleteNotifications,
    getNotificationsTopic,
    getDetailNotificationTopic,
    deleteNotificationsTopic,
    updateNotificationsTopic,
    createNotificationsTopic,
    sendNotifications,
    cancelScheduledNotification,
    uploadNotificationsCSV,
} = require("../../libs/controllers/admin/admin-notifications");
const { authAdmin } = require("../../libs/middleware/lib-auth");
const uploadCSV = require("../../libs/middleware/uploadCSV");

module.exports = require("express")
    .Router()
    .use(authAdmin)
    .get("/", async (req, res) => {
        await getNotificationsPaginated(req, res);
    })
    .post("/", async (req, res) => {
        await createNotifications(req, res);
    })
    .post("/send/:id", async (req, res) => {
        await sendNotifications(req, res);
    })
    .post("/cancel/:id", async (req, res) => {
        await cancelScheduledNotification(req, res);
    })
    .put("/:id", async (req, res) => {
        await updateNotifications(req, res);
    })
    .delete("/:id", async (req, res) => {
        await deleteNotifications(req, res);
    })
    .get("/topic", async (req, res) => {
        await getNotificationsTopic(req, res);
    })
    .get("/topic/:id", async (req, res) => {
        await getDetailNotificationTopic(req, res);
    })
    .post("/topic/:id/upload", uploadCSV.single('file'), async (req, res) => {
        await uploadNotificationsCSV(req, res);
    })
    .post("/topic", async (req, res) => {
        await createNotificationsTopic(req, res);
    })
    .delete("/topic/:id", async (req, res) => {
        await deleteNotificationsTopic(req, res);
    })
    .put("/topic/:id", async (req, res) => {
        await updateNotificationsTopic(req, res);
    });
