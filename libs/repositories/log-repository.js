const Sentry = require("@sentry/node");
const prisma = require("../lib-prisma");
const { LogType } = require("@prisma/client");

const logRepository = {
    createLogDB: async (data) => {
        try {
            let log = await prisma.log.create({
                data: data,
            });

            return log;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    getLogsPaginated: async (
        accountId,
        paginationParameters,
        query,
        sortType = null
    ) => {
        try {
            // console.log(query);
            const users = await prisma.user.findMany({
                where: {
                    accountId,
                },
                select: {
                    id: true,
                },
            });

            const arrUserId = users.map((a) => {
                return a.id;
            });

            const logs = await prisma.log.findMany({
                ...(query.q
                    ? {
                          where: {
                              userId: { in: arrUserId },
                              User: {
                                  OR: [
                                      {
                                          firstname: {
                                              contains: query.q,
                                          },
                                      },
                                  ],
                              },
                              ...(query.type
                                  ? {
                                        type: query.type,
                                    }
                                  : {}),
                          },
                      }
                    : {
                          where: {
                              userId: { in: arrUserId },
                              ...(query.type
                                  ? {
                                        type: query.type,
                                    }
                                  : {}),
                          },
                      }),
                include: {
                    Prompt: true,
                    User: true,
                },
                orderBy: {
                    createdAt : 'desc'
                },
                ...paginationParameters,
            });

            const numLogs = await prisma.log.count({
                ...(query != null
                    ? {
                          where: {
                              userId: { in: arrUserId },
                              User: {
                                  OR: [
                                      {
                                          firstname: {
                                              contains: query.q,
                                          },
                                      },
                                  ],
                              },
                              ...(query.type
                                  ? {
                                        type: query.type,
                                    }
                                  : {}),
                          },
                      }
                    : {
                          where: {
                              userId: { in: arrUserId },
                          },
                          ...(query.type
                              ? {
                                    type: query.type,
                                }
                              : {}),
                      }),
            });

            return {
                logs,
                pagination: { ...paginationParameters, total: numLogs },
                type: Object.keys(LogType),
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    createMailLog: async (data) => {
        try {
            const mailog = await prisma.mailLog.create({
                data,
            });
            return mailog;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getMailLogsPaginated: async (accountId, paginationParameters) => {
        try {
            const mails = await prisma.mailLog.findMany({
                where: {
                    User: {
                        accountId,
                    },
                },
                include: {
                    User: true,
                },
                orderBy: {
                    createdAt: "desc",
                },
                ...paginationParameters,
            });
            const total = await prisma.mailLog.count({
                where: {
                    User: {
                        accountId,
                    },
                },
            });
            return { mails, pagination: { ...paginationParameters, total } };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    addNewTransaction : async (data) => {
        try {
            const transaction = await prisma.transactionHistory.create({
                data,
            });
            return transaction;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getTransactionHistory : async (paginationParameters) => {
        try {
            const transactions = await prisma.transactionHistory.findMany({
                ...paginationParameters,
                include : {
                    Account : true
                },
                orderBy : {
                    createdAt : 'desc'
                }
            });
            const total = await prisma.transactionHistory.count();

            return { transactions, pagination: { ...paginationParameters, total } };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    }
};

module.exports = logRepository;
