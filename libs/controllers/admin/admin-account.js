const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const { getPaginationParameters } = require("../../helpers/pagination");
const {
    getAllAccounts,
    getAccountDetail,
    deleteAccountDB,
    disenableAccountDB,
    getAllSubscribers,
    getAllFreeTrials,
    downloadAllSubscriber,
    fetchAbandonedUsers,
    updateExpired,
    forceAccountExpired,
    customToken,
    resetToken,
} = require("../../repositories/admin/account-repository");
const {
    getUsersPaginated,
} = require("../../repositories/admin/user-repository");
const Joi = require("joi");
const { accountUsage, globalUsage } = require("../../service/usageService");
const StripeService = require("../../service/stripeService");
const mailchimpContactsService = require("../../service/mailchimpContactsService");
const { PaymentSource } = require("@prisma/client");
const normalizeEmail = require("normalize-email");
const xlsxGenerator = require("../../service/xlsxGenerator");
const dayjs = require("dayjs");
const redis = require("../../lib-ioredis");
const { default: axios } = require("axios");

const adminAccountController = {
    getAccounts: async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await getAllAccounts(
                paginationParameters,
                req.query.search || null
            );

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getSubscribers: async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            // console.log('kemari', req.query)
            let result = await getAllSubscribers(
                paginationParameters,
                req.query.search || null
            );
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    downloadSubscriber: async (req, res) => {
        try {
            const data = await downloadAllSubscriber();

            const buffer = xlsxGenerator(data);

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=subscribers_data.xlsx"
            );

            res.send(buffer);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            if (!res.headersSent) {
                // Set appropriate status code and error message
                render(res, 500, statuscodes.DB_ERROR, {});
            }
        }
    },
    getFreetrials: async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await getAllFreeTrials(
                paginationParameters,
                req.query.search || null
            );
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getAbandonedUser: async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await fetchAbandonedUsers(paginationParameters);

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getAccountDetail: async (req, res) => {
        try {
            let result = await getAccountDetail(parseInt(req.params.id));

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    deleteAccount: async (req, res) => {
        try {
            let account = await getAccountDetail(parseInt(req.params.id));
            if (!account) {
                render(res, 200, statuscodes.NOT_FOUND, {});
                return;
            }
            let email = account.email;

            // We have to check if is a stripe or apple user and cancel that subscription
            if (account.paymentSource === PaymentSource.STRIPE) {
                await StripeService.cancelSubscription(account.subscriptionId);
            } else if (account.paymentSource === PaymentSource.APPLE) {
                // await appleService.cancelSubscription(account.appleSubscriptionId);
            }

            let result = await deleteAccountDB(parseInt(req.params.id));

            // await mailchimpContactsService.deleteWaitlistContact(
            //     normalizeEmail(email)
            // );

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    disenableAccount: async (req, res) => {
        try {
            let result = await disenableAccountDB(
                parseInt(req.params.id),
                req.body.status
            );

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    changeExpired: async (req, res) => {
        try {
            let result = await updateExpired(
                parseInt(req.params.id),
                req.body.date
            );

            await redis.publish(
                "mattermost:userexpirationupdate",
                JSON.stringify({
                    message: `${result.email} Expiration Updated from ${dayjs(
                        req.body.date
                    ).format("YYYY-MM-DD")} to ${dayjs(
                        result.subscriptionCurrentPeriodEnd
                    ).format("YYYY-MM-DD")}`,
                })
            );

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    forceExpired: async (req, res) => {
        try {
            let result = await forceAccountExpired(parseInt(req.params.id));
            await redis.publish(
                "mattermost:userexpirationupdate",
                JSON.stringify({
                    message: `${result.email} Subscription Force Expired Updated.`,
                })
            );
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    createEditCustomToken: async (req, res) => {
        try {
            let result = await customToken(parseInt(req.params.id), req.body.value);
            await redis.publish(
                "mattermost:userexpirationupdate",
                JSON.stringify({
                    message: `${result.email} Edit Custom Token Updated.`,
                })
            );
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    resetAccountTokenUsage : async (req, res) => {
        try {
            let result = await resetToken(parseInt(req.params.id));
            await redis.publish(
                "mattermost:userexpirationupdate",
                JSON.stringify({
                    message: `${result.email} Reset User Token Updated.`,
                })
            );
            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getUsers: async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(
                req,
                parseInt(req.params.id)
            );
            let result = await getUsersPaginated(paginationParameters);

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    getAccountUsage: async (req, res) => {
        try {
            const schema = Joi.object({
                startDate: Joi.date().required(),
                endDate: Joi.date().required(),
                accountId: Joi.number().integer().required(),
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }
            let account = await getAccountDetail(parseInt(value.accountId));
            if (!account) {
                render(res, 400, statuscodes.ACCOUNT_NOT_FOUND, error);
                return;
            }

            let usage = await accountUsage(
                account.id,
                value.startDate,
                value.endDate
            );
            render(res, 200, statuscodes.OK, usage);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    getGlobalUsage: async (req, res) => {
        try {
            const schema = Joi.object({
                startDate: Joi.date().required(),
                endDate: Joi.date().required(),
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            let usage = await globalUsage(value.startDate, value.endDate);
            render(res, 200, statuscodes.OK, usage);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
    editAccount: async (req, res) => {
        try {
            const result = await editAccount(req.body);
            render(res, 201, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    verifyReceipt: async(req, res) => {
        try {
            const schema = Joi.object({
                receipt: Joi.string().required(),
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }
            
            axios
                .post(process.env.APPSTORE_RECEIPT_API, {
                        "receipt-data": value.receipt,
                        "password": process.env.APPSTORE_RECEIPT_PASSWORD,
                        "exclude-old-transactions": true 
                    })
                .then((response) => {
                    render(res, 201, statuscodes.OK, response.data);
                })
                .catch((e) => {
                    console.error(e);
                    Sentry.captureException(e);
                    render(res, 500, statuscodes.INTERNAL_ERROR, {});
                });
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    }
};

module.exports = adminAccountController;
