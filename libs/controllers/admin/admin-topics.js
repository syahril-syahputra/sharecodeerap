const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const { getPaginationParameters } = require("../../helpers/pagination");
const {
    getAllTopics,
    deleteTopicDB,
    createTopicDB,
    editTopicDB,
    getOneTopic,
} = require("../../repositories/admin/topic-repository");
const downloadImageService = require("../../service/s3Service");
const path = require("path");
const fs = require("fs").promises;
const os = require("os");

const adminTopicController = {
    createTopic: async (req, res) => {
        try {
            // console.log(req.body)
            let image;
            let idx = Date.now()
            const slugName = req.body.name.replace(/\s+/g, '-');
            const filePath = path.join(os.tmpdir());
            if (req.body?.files[0]?.thumbUrl) {
                image = await downloadImageService.uploadS3base64(
                    req.body.files[0].thumbUrl,
                    'image/'+filePath.slice(1) + "/" + slugName + '-' + idx + ".png"
                );
                req.body.imageUrl = image.Location;
                req.body.imageId = `${idx}`
                delete req.body.files;
            }
            // console.log(filePath);

            let result = await createTopicDB(req.body);

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    editTopic: async (req, res) => {
        try {
            // console.log(req.body)
            let image;
            const filePath = path.join(os.tmpdir());
            const topic = await getOneTopic(parseInt(req.params.id));

            if (!topic) {
                render(res, 404, statuscodes.NOT_FOUND, {});
                return;
            }
            const idx = topic.imageId ? topic.imageId : Date.now();
            const slug = (topic.name === req.body.name) ? topic.name.replace(/\s+/g, '-') : req.body.name.replace(/\s+/g, '-');
            // console.log(slug, topic.name === req.body.name)
            if (req.body.files) {
                image = await downloadImageService.uploadS3base64(
                    req.body.files[0].thumbUrl,
                    'image/'+filePath.slice(1) + "/" + slug + '-' + idx + ".png"                
                    );
                req.body.imageUrl = image.Location;
                delete req.body.files;
            }
            if(!topic.imageId) req.body.imageId = `${idx}`
            // console.log(filePath);

            let result = await editTopicDB(req.body, parseInt(req.params.id));

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getTopics: async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await getAllTopics(paginationParameters);

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    deleteTopic: async (req, res) => {
        try {
            let result = await deleteTopicDB(parseInt(req.params.id));

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
};

module.exports = adminTopicController;
