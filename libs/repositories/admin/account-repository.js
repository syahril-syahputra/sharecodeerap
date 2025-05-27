const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");
const { LogType, PaymentSource, PromptType } = require("@prisma/client");
const { eurekaTokensSpent } = require("../../service/usageService");
const dayjs = require("dayjs");

const accountRepository = {
    getAllAccounts: async (paginationParameters, search = null) => {
        try {
            const condition = {
                ...paginationParameters,
                include: {
                    User: true,
                    Plan: true,
                    Product: true,
                    TransactionHistory: true,
                },

                ...(search != null
                    ? {
                          where: {
                              User: {
                                  some: {
                                      OR: [
                                          {
                                              email: {
                                                  contains: search,
                                              },
                                          },
                                          {
                                              firstname: {
                                                  contains: search,
                                              },
                                          },
                                          {
                                              lastname: {
                                                  contains: search,
                                              },
                                          },
                                      ],
                                  },
                              },
                          },
                      }
                    : {}),
                orderBy: [
                    {
                        id: "desc",
                    },
                ],
            };

            const accounts = await prisma.account.findMany(condition);

            const numAccounts = await prisma.account.count({
                ...(search != null
                    ? {
                          where: {
                              User: {
                                  some: {
                                      OR: [
                                          {
                                              email: {
                                                  contains: search,
                                              },
                                          },
                                          {
                                              firstname: {
                                                  contains: search,
                                              },
                                          },
                                          {
                                              lastname: {
                                                  contains: search,
                                              },
                                          },
                                      ],
                                  },
                              },
                          },
                      }
                    : {}),
            });

            for (let e = 0; e < accounts.length; e++) {
                const el = accounts[e];
                el.appOpens = await prisma.log.count({
                    where: {
                        User: {
                            accountId: el.id,
                        },
                        type: LogType.USER_OPENED_APP,
                    },
                });
            }

            return {
                accounts: accounts,
                pagination: { ...paginationParameters, total: numAccounts },
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAllSubscribers: async (paginationParameters, search = null) => {
        try {
            const accounts = await prisma.account.findMany({
                ...paginationParameters,
                include: {
                    User: true,
                    Plan: true,
                    Product: true,
                    TransactionHistory: true,
                },

                ...(search != null
                    ? {
                          where: {
                              status: 1,
                              subscriptionCurrentPeriodEnd: {
                                  not: null,
                                  gte: dayjs()
                                      .endOf("day")
                                      .add(1, "day")
                                      .toDate(),
                              },
                              subscriptionCurrentPeriodStart: {
                                  not: null,
                              },
                              subscriptionStatus: "active",
                              User: {
                                  some: {
                                      OR: [
                                          {
                                              email: {
                                                  contains: search,
                                              },
                                          },
                                          {
                                              firstname: {
                                                  contains: search,
                                              },
                                          },
                                          {
                                              lastname: {
                                                  contains: search,
                                              },
                                          },
                                      ],
                                  },
                              },
                          },
                      }
                    : {
                          where: {
                              subscriptionCurrentPeriodEnd: {
                                  not: null,
                                  gte: dayjs()
                                      .endOf("day")
                                      .add(1, "day")
                                      .toDate(),
                              },
                              subscriptionCurrentPeriodStart: {
                                  not: null,
                              },
                              status: 1,
                              subscriptionStatus: "active",
                          },
                      }),
                orderBy: [
                    {
                        id: "desc",
                    },
                ],
            });

            const numAccounts = await prisma.account.count();

            for (let e = 0; e < accounts.length; e++) {
                const el = accounts[e];
                el.appOpens = await prisma.log.count({
                    where: {
                        User: {
                            accountId: el.id,
                        },
                        type: LogType.USER_OPENED_APP,
                    },
                });
                el.usageToken = { tokensUsed } = await eurekaTokensSpent(
                    el.id,
                    el.subscriptionCurrentPeriodStart,
                    el.subscriptionCurrentPeriodEnd
                );
            }

            return {
                accounts: accounts,
                pagination: { ...paginationParameters, total: numAccounts },
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    downloadAllSubscriber: async () => {
        try {
            const raw = await prisma.account.findMany({
                where: {
                    subscriptionCurrentPeriodEnd: {
                        not: null,
                        gte: dayjs().endOf("day").add(1, "day").toDate(),
                    },
                    subscriptionCurrentPeriodStart: {
                        not: null,
                    },
                    subscriptionStatus: "active",
                },
                include: {
                    Plan: true,
                    Product: true,
                },
            });

            for (let e = 0; e < raw.length; e++) {
                const el = raw[e];
                if (el.Plan) {
                    el.PlanName = el.Plan.name;
                    delete el.Plan;
                    delete el.Product;
                } else {
                    el.PlanName = el.Product.name;
                    delete el.Plan;
                    delete el.Product;
                }
                el.appOpens = await prisma.log.count({
                    where: {
                        User: {
                            accountId: el.id,
                        },
                        type: LogType.USER_OPENED_APP,
                    },
                });
            }

            // console.log(raw)

            return raw;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAllFreeTrials: async (paginationParameters, search = null) => {
        try {
            const accounts = await prisma.account.findMany({
                ...paginationParameters,
                include: {
                    User: true,
                    Plan: true,
                    Product: true,
                    TransactionHistory: true,
                },

                ...(search != null
                    ? {
                          where: {
                              subscriptionCurrentPeriodEnd: {
                                  not: null,
                                  gte: dayjs().startOf("day").toDate(),
                              },
                              subscriptionCurrentPeriodStart: {
                                  not: null,
                              },
                              subscriptionStatus: "trialing",
                              User: {
                                  some: {
                                      OR: [
                                          {
                                              email: {
                                                  contains: search,
                                              },
                                          },
                                          {
                                              firstname: {
                                                  contains: search,
                                              },
                                          },
                                          {
                                              lastname: {
                                                  contains: search,
                                              },
                                          },
                                      ],
                                  },
                              },
                          },
                      }
                    : {
                          where: {
                              subscriptionCurrentPeriodEnd: {
                                  not: null,
                                  gte: dayjs().startOf("day").toDate(),
                              },
                              subscriptionCurrentPeriodStart: {
                                  not: null,
                              },
                              subscriptionStatus: "trialing",
                          },
                      }),
                orderBy: [
                    {
                        id: "desc",
                    },
                ],
            });

            const numAccounts = await prisma.account.count();

            for (let e = 0; e < accounts.length; e++) {
                const el = accounts[e];
                el.appOpens = await prisma.log.count({
                    where: {
                        User: {
                            accountId: el.id,
                        },
                        type: LogType.USER_OPENED_APP,
                    },
                });
                el.usageToken = { tokensUsed } = await eurekaTokensSpent(
                    el.id,
                    el.subscriptionCurrentPeriodStart,
                    el.subscriptionCurrentPeriodEnd
                );
            }

            return {
                accounts: accounts,
                pagination: { ...paginationParameters, total: numAccounts },
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAccountDetail: async (accountId) => {
        try {
            const account = await prisma.account.findFirst({
                where: {
                    id: accountId,
                },
                include: {
                    User: {
                        include: {
                            UserLevel: true,
                            UserNotificationTopic: {
                                where: {
                                    active: true,
                                },
                                include: {
                                    NotificationTopic: true,
                                },
                            },
                        },
                    },
                    Product: {
                        include: {
                            Prices: true,
                        },
                    },
                    Plan: true,
                    TransactionHistory: true,
                },
            });
            const features = await prisma.prompt.findMany({
                where: {
                    user: {
                        accountId,
                    },
                },
                select: {
                    type: true,
                },
            });
            // console.log(features)
            account.usedFeatures = [...new Set(features.map((e) => e.type))];
            account.usageToken = await eurekaTokensSpent(
                account.id,
                account.subscriptionCurrentPeriodStart,
                account.subscriptionCurrentPeriodEnd,
                true
            );

            return account;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deleteAccountDB: async (accountId) => {
        try {
            console.log(accountId);

            const account = await prisma.account.delete({
                where: {
                    id: accountId,
                },
            });

            console.log(accountId);
            console.log(account);

            return account;
        } catch (e) {
            console.log(e);
            console.error(e);
            Sentry.captureException(e);
        }
    },
    disenableAccountDB: async (accountId, status) => {
        try {
            const account = await prisma.account.update({
                where: {
                    id: accountId,
                },
                data: {
                    status: status,
                },
            });

            return account;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    updateExpired: async (accountId, date) => {
        try {
            const acc = await prisma.account.findFirst({
                where: {
                    id: accountId,
                },
            });
            const account = await prisma.account.update({
                where: {
                    id: accountId,
                },
                data: {
                    subscriptionCurrentPeriodEnd: date,
                },
            });

            const updateLogs = await prisma.transactionHistory.create({
                data: {
                    accountId: accountId,
                    type: account.paymentSource,
                    data: JSON.stringify({
                        message: `Update User Expired Date from : ${acc.subscriptionCurrentPeriodEnd} to : ${date}`,
                    }),
                },
            });

            return account;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    forceAccountExpired: async (accountId) => {
        try {
            const account = await prisma.account.update({
                where: {
                    id: accountId,
                },
                data: {
                    subscriptionCurrentPeriodEnd: dayjs()
                        .startOf("day")
                        .toDate(),
                    subscriptionStatus: "expired",
                },
            });

            const updateLogs = await prisma.transactionHistory.create({
                data: {
                    accountId: accountId,
                    type: account.paymentSource,
                    data: JSON.stringify({
                        message: `Force user expiration date`,
                    }),
                },
            });

            return account;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    customToken: async (accountId, value) => {
        try {
            const acc = await prisma.account.findFirst({
                where: { id: accountId },
                select: {
                    User: true,
                    email: true,
                    id: true,
                    subscriptionCurrentPeriodStart: true,
                    subscriptionCurrentPeriodEnd: true,
                },
            });
            const usage = await eurekaTokensSpent(
                acc.id,
                acc.subscriptionCurrentPeriodStart,
                acc.subscriptionCurrentPeriodEnd,
                true
            );
            
            const newCustomToken = await prisma.prompt.create({
                data: {
                    userId: acc.User[0].id,
                    type: PromptType.CUSTOM_TOKEN,
                    totalTokens:
                        usage.tokensUsed > value
                            ? (usage.tokensUsed - value) * -1
                            : value - usage.tokensUsed,
                    request: "customToken",
                },
            });

            return acc;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    resetToken: async (accountId) => {
        try {
            const acc = await prisma.account.findFirst({
                where: {
                    id: accountId,
                },
                select: {
                    User: true,
                    email: true,
                    id: true,
                    subscriptionCurrentPeriodStart: true,
                    subscriptionCurrentPeriodEnd: true,
                },
            });
            const usage = await eurekaTokensSpent(
                acc.id,
                acc.subscriptionCurrentPeriodStart,
                acc.subscriptionCurrentPeriodEnd,
                true
            );

            const newCustomToken = await prisma.prompt.create({
                data: {
                    user: {
                        connect: {
                            id: acc.User[0].id,
                        },
                    },
                    type: PromptType.CUSTOM_TOKEN,
                    totalTokens: usage.tokensUsed * -1,
                    request: "Reset Token",
                },
            });

            return acc;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    fetchAbandonedUsers: async (pagination) => {
        try {
            const audience = await prisma.abandonedEmail.findMany({
                ...pagination,
                orderBy: {
                    createdAt: "desc",
                },
            });
            const total = await prisma.abandonedEmail.count();
            return {
                audience,
                pagination: {
                    ...pagination,
                    total,
                },
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAccountByTransactionId: async (transactionId) => {
        try {
            const account = await prisma.account.findFirst({
                where: {
                    transactionId,
                },
            });

            return account;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
};

module.exports = accountRepository;
