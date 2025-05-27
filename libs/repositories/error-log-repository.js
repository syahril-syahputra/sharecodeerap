const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");

const errorlogRepository = {
    createLogDB : async ( data ) => {
        try {
            let log = await prisma.errorLog.create({
                data : data
            })

            return log
        } catch (e) {
            console.log(e)
            console.error(e)
            // Sentry.captureException(e)
        }
    },
    getErrorLogPaginated : async (paginationParameters) => {
        try {
            let logs = await prisma.errorLog.findMany({
                ...paginationParameters,
                orderBy: {
                    id : 'desc'
                }
            }) 

            const numLogs = await prisma.errorLog.count()


            return {logs : logs, pagination : {...paginationParameters, total : numLogs}}
        } catch (e) {
            console.log(e)
            console.error(e)
            // Sentry.captureException(e)
        }
    },
    getResponseTimeInTimeRange: async (start, end) => {
        try {
            const result = await prisma.errorLog.aggregate({
                _avg: {
                    responseTime: true,
                },
                where: {
                    createdAt: {
                        gte: start,
                        lte: end,
                    },
                },
            });

            const averageValue = result._avg.responseTime ?? null;

            return averageValue;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
}

module.exports = errorlogRepository