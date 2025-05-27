const statuscodes = require("../helpers/statuscodes");
const Sentry = require("@sentry/node");
const render = require("../helpers/render");
const {
    getAllUsersFromAccount,
    registerNewUser,
    findUserById,
} = require("../repositories/user-repository");
const { LogType, PaymentSource, PlanType } = require("@prisma/client");
const {
    accountDetail,
    registerNewAccount,
    editAccount,
} = require("../repositories/account-repository");
const { getPaginationParameters } = require("../helpers/pagination");
const { eurekaTokensSpent } = require("../service/usageService");
const Joi = require("joi");
const logService = require("../service/logService");
const normalizeEmail = require("normalize-email");
const generatePin = require("../helpers/generatePin");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const {
    getAccountDetail,
    deleteAccountDB,
} = require("../repositories/admin/account-repository");
const StripeService = require("../service/stripeService");
const mailchimpContactsService = require("../service/mailchimpContactsService");
const { getPlanById } = require("../repositories/plan-repository");
const dayjs = require("dayjs");
const redis = require("../lib-ioredis");
const onboardingEmailRepository = require("../repositories/onboarding-email-repository");

const accountController = {
    getAccount: async (req, res) => {
        try {
            let account = await accountDetail(req.user.account.id);
            let usage = await eurekaTokensSpent(
                req.user.account.id,
                account.subscriptionCurrentPeriodStart,
                account.subscriptionCurrentPeriodEnd
            );

            await logService.createLog(req, {
                type: LogType.GET_ACCOUNT,
                message: `Get Account with id ${
                    req.user.account.id
                } at ${new Date()} by user with id : ${req.user.id}`,
            });
            console.log("usage", usage);
            render(res, 200, statuscodes.OK, {
                ...account,
                tokensUsed: usage.tokensUsed,
            });
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    getUsers: async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await getAllUsersFromAccount(
                req.user.accountId,
                paginationParameters
            );

            await logService.createLog(req, {
                type: LogType.GET_USERS,
                message: `Get all list user by Account with id : ${
                    req.user.account.id
                } at ${new Date()}`,
            });

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    getAccountUsage: async (req, res) => {
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

            let usage = await eurekaTokensSpent(
                req.user.account.id,
                value.startDate,
                value.endDate
            );

            await logService.createLog(req, {
                type: LogType.GET_ACCOUNT_USAGE,
                message: `Get account Usage by id : ${
                    req.user.account.id
                } at ${new Date()}`,
            });

            render(res, 200, statuscodes.OK, usage);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    upgradeAppleSubscription: async (req, res) => {
        try {
            const schema = Joi.object({
                planId: Joi.number().required(),
                transactionId : Joi.string(),
                receipt: Joi.string().required(),
                type: Joi.string(),
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            let user = req.user;

            const plan = await getPlanById(value.planId);

            let startDate = dayjs();
            let endDate;
            switch (plan.type) {
                case PlanType.MONTHLY:
                    endDate = startDate.add(1, "month");
                    break;
                case PlanType.YEARLY:
                    endDate = startDate.add(1, "year");
                    break;
            }

            let account = await editAccount(user.account.id, {
                status: 1,
                planId: plan.id,
                transactionId: value.transactionId,
                subscriptionCreatedAt: startDate.toDate(),
                subscriptionCurrentPeriodStart: startDate.toDate(),
                subscriptionCurrentPeriodEnd: endDate.toDate(),
                subscriptionStatus: "active",
                paymentSource: PaymentSource[value.type],
                appleReceipt: value.receipt,
            });

            await redis.publish(
                "mattermost:userpayment",
                JSON.stringify({
                    user: req.user,
                    paymentSource: account.paymentSource,
                    plan: account.Plan.name,
                })
            );

            await logService.createTransactionLog({
                                    accountId: user.account.id, 
                                    type: PaymentSource[value.type], 
                                    data: {
                                            accountId: user.account.id,
                                            receipt: value.receipt,
                                            message: `Update User plan to: ${plan.name} ${plan.type}`,
                                        }
                                    });

            render(res, 200, statuscodes.OK, account);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    deleteAccount: async (req, res) => {
        try {
            if (!req.user.isAdmin) {
                render(
                    res,
                    400,
                    statuscodes.ADMIN_PERMISSION_REQ,
                    "Admin permission required"
                );
                return;
            }

            // We have to check if is a stripe or apple user and cancel that subscription
            if (req.user.account.paymentSource === PaymentSource.STRIPE) {
                await StripeService.cancelSubscription(
                    req.user.account.subscriptionId
                );
            } else if (req.user.account.paymentSource === PaymentSource.APPLE) {
                // await appleService.cancelSubscription(account.appleSubscriptionId);
            }

            let result = await deleteAccountDB(parseInt(req.user.account.id));
            // await mailchimpContactsService.deleteWaitlistContact(
            //     normalizeEmail(req.user.email)
            // );

            await redis.publish(
                "mattermost:userdeleteaccount",
                JSON.stringify({
                    message: `${req.user.email} Deleted their account`,
                })
            );

            render(res, 200, statuscodes.OK, "Ok");
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    recordOnboardingEmail: async (req, res) => {
        try {
            const schema = Joi.object({
                email: Joi.string().email().required(),
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            await onboardingEmailRepository.addEmail(value.email);

            await redis.publish(
                "mattermost:onboardingemail",
                JSON.stringify({
                    email: value.email,
                })
            );
            // todo - if we wanted to add the user's email to some Mailchimp list, we could do it here

            render(res, 200, statuscodes.OK, "Ok");
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    renewSubscriptionFromReceipt: async (req, res) => {
        try {
            const schema = Joi.object({
                transactionId: Joi.string().required(),
                purchaseDate: Joi.string().required(),
                expirationDate: Joi.string().required(),
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            let account = await editAccount(req.user.account.id, {
                subscriptionCurrentPeriodStart: new Date(parseInt(value.purchaseDate)),
                subscriptionCurrentPeriodEnd: new Date(parseInt(value.expirationDate)),
                transactionId: value.transactionId,
                subscriptionStatus: "active"
            });

            render(res, 200, statuscodes.OK, account);
            
            await redis.publish(
                "mattermost:userexpirationupdate",
                JSON.stringify({
                    message: `${account.email} Expiration Updated from ${dayjs(
                        req.user.account.subscriptionCurrentPeriodEnd
                    ).format("YYYY-MM-DD")} to ${dayjs(
                        account.subscriptionCurrentPeriodEnd
                    ).format("YYYY-MM-DD")}`,
                })
            );

        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    }
};
module.exports = accountController;
