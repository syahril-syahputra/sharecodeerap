const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const { getPaginationParameters } = require("../../helpers/pagination");
const queryRepository = require("../../repositories/admin/query-repository");

const adminQueryController = {
    createQuery: async (req, res) => {
        try {
            const value = req.body;
            value.userAdminId = req.userId;
            let result = await queryRepository.createQuery(
                {
                    name: value.name,
                    isSQL: value.isSQL,
                    userAdminId: req.userId,
                    rawSQL: value.rawSQL,
                },
            );
            if (!result.isSQL && value?.conditions?.length) {
                let data = value.conditions.map((e) => {
                    e.queryId = result.id;
                    return e;
                });
                let conditions = await queryRepository.createConditions(data, true);
                console.log(conditions);
            }
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    editQuery: async (req, res) => {
        try {
            let result = await queryRepository.editQuery(
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
    getQueries: async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await queryRepository.getQueriesPaginated(
                paginationParameters
            );
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    deleteQuery: async (req, res) => {
        try {
            let result = await queryRepository.deleteQuery(
                parseInt(req.params.id)
            );

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getQueryFields: async (req, res) => {
        try {
            let result = await queryRepository.getAllQueryFields(
                req.query.isSQL
            );
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    createConditions: async (req, res) => {
        try {
            let result = await queryRepository.createConditions(req.body,false);
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getQueryConditions: async (req, res) => {
        try {
            let result = await queryRepository.getQueryConditions(
                parseInt(req.params.id)
            );
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    tryRawQuery: async (req, res) => {
        try {
            const query = req.body.query;
            if (!query) {
                render(res, 500, statuscodes.BAD_REQUEST, {});
                return;
            }
            if (
                query.toLowerCase().includes("drop") ||
                query.toLowerCase().includes("delete") ||
                query.toLowerCase().includes("update")
            ) {
                render(res, 500, statuscodes.BAD_REQUEST, {});
                return;
            }
            let result = await queryRepository.tryRawQuery(query);
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            // Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    deleteConditions: async (req, res) => {
        try {
            let result = await queryRepository.deleteConditions(
                parseInt(req.params.id)
            );
            
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    }
};

module.exports = adminQueryController;
