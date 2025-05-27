const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const { getPaginationParameters } = require("../../helpers/pagination");
const {
    getAllActivities,
    deleteActivityDB,
    createActivityDB,
    editActivityDB,
    getTopicActivityById,
    getAllActivitiesByLanguage,
    getOneActivity,
} = require("../../repositories/admin/activity-repository");
const downloadImageService = require("../../service/s3Service");
const path = require("path");
const os = require("os");

const adminActivityController = {
    createActivity: async (req, res) => {
        try {
            let image;
            let idx = Date.now();
            const slugName = req.body.name.replace(/\s+/g, "-");
            const filePath = path.join(os.tmpdir());
            if (req.body?.files[0]?.thumbUrl) {
                image = await downloadImageService.uploadS3base64(
                    req.body.files[0].thumbUrl,
                    "image/" +
                        filePath.slice(1) +
                        "/" +
                        slugName +
                        "-" +
                        idx +
                        ".png"
                );
                req.body.imageUrl = image.Location;
                req.body.imageId = `${idx}`;
                delete req.body.files;
            }

            let result = await createActivityDB(req.body);

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    editActivity: async (req, res) => {
        try {
            const activity = await getOneActivity(parseInt(req.params.id))
            const idx = activity.imageId ? activity.imageId : Date.now();
            const slug =
                activity.name === req.body.name
                    ? activity.name.replace(/\s+/g, "-")
                    : req.body.name.replace(/\s+/g, "-");
            // console.log(slug, topic.name === req.body.name)
            const filePath = path.join(os.tmpdir());
            if (req.body.files) {
                image = await downloadImageService.uploadS3base64(
                    req.body.files[0].thumbUrl,
                    "image/" +
                        filePath.slice(1) +
                        "/" +
                        slug +
                        "-" +
                        idx +
                        ".png"
                );
                req.body.imageUrl = image.Location;
                delete req.body.files;
            }
            if (
                (req.body.name !== activity.name && req.body?.files) ||
                (req.body.imageUrl !== activity.imageUrl && req.body.imageUrl) 
                // ||
                // (req.body.files && req.body?.files[0]?.thumbUrl)
            ) {
                const res = await downloadImageService.deleteS3assets(
                    "image/" +
                        filePath.slice(1) +
                        "/" +
                        activity.name.replace(/\s+/g, "-") +
                        "-" +
                        activity.imageId +
                        ".png"
                );
            }

            if (!activity.imageId) req.body.imageId = `${idx}`;
            let result = await editActivityDB(
                req.body,
                parseInt(req.params.id)
            );

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getActivities: async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await getAllActivities(paginationParameters);

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getTopicActivity: async (req, res) => {
        try {
            const { id } = req.params;
            let paginationParameters = getPaginationParameters(req);
            let result = await getTopicActivityById(
                parseInt(id),
                paginationParameters
            );

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    deleteActivity: async (req, res) => {
        try {
            let result = await deleteActivityDB(parseInt(req.params.id));

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
};

module.exports = adminActivityController;
