const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const { getPaginationParameters } = require("../../helpers/pagination");
const {
    getLogsPaginated,
    getMailLogsPaginated,
    getTransactionHistory,
} = require("../../repositories/log-repository");
const {
    getErrorLogPaginated,
} = require("../../repositories/error-log-repository");

const adminLogsController = {
    getLogsAccount: async (req, res) => {
        try {
            const pagination = getPaginationParameters(req);
            const { id: accountId } = req.params;
            let result = await getLogsPaginated(
                parseInt(accountId),
                pagination,
                req.query
            );
            // console.log(result)
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    getErrorLogs: async (req, res) => {
        try {
            const pagination = getPaginationParameters(req);
            let result = await getErrorLogPaginated(pagination);

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    getMailLogs: async (req, res) => {
        try {
            const pagination = getPaginationParameters(req);
            let result = await getMailLogsPaginated(
                parseInt(req.params.id),
                pagination
            );

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    getTransactionLogs: async (req, res) => {
        try {
            const pagination = getPaginationParameters(req);
            let result = await getTransactionHistory(pagination);

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
};

module.exports = adminLogsController;
