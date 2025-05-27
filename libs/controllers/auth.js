const Joi = require("joi");
const statuscodes = require("../helpers/statuscodes");
const prisma = require("../lib-prisma");
const Sentry = require("@sentry/node");
const render = require("../helpers/render");
const crypto = require("crypto");
const useragent = require("useragent");
const UAP = require("ua-parser-js");
const normalizeEmail = require("normalize-email");
const Bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const redis = require("../lib-ioredis");
const { getExpiration } = require("../helpers/time");
const {
    verifyAccount,
    registerNewAccount,
    updateSubscription,
} = require("../repositories/account-repository");
const {
    isUserEmailExist,
    findBasicUserById,
    verifyUser,
    findAnyUserByEmail,
    createLoginCredentials,
    lastLoginUpdate,
    editDeviceUser,
    findUserById,
    updateUserData,
} = require("../repositories/user-repository");
const { sendLocalTemplateEmail } = require("../helpers/aws-ses");
const generatePin = require("../helpers/generatePin");
const mailchimpEmailService = require("../service/mailchimpEmailService");
const logService = require("../service/logService");
const {
    MailLogType,
    TrialPeriod,
    PlanType,
    LogType,
    PaymentSource,
} = require("@prisma/client");
const {
    getStripeVisibilityForUser,
} = require("../repositories/settings-repository");
const userRepository = require("../repositories/user-repository");
const planRepository = require("../repositories/plan-repository");
const dayjs = require("dayjs");
const mailchimpContactsService = require("../service/mailchimpContactsService");
const languageRepository = require("../repositories/language-repository");
const languageService = require("../service/languageService");

const account = {
    checkExisting: async (req, res) => {
        try {
            const schema = Joi.object({
                email: Joi.string().email().required(),
                device : Joi.string(),
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            // console.log(value?.device)

            const { "user-agent": userAgent } = req.headers;

            const device = useragent.parse(userAgent).device.toString();
            // console.log(device)
            const userExists = await isUserEmailExist(value.email, res);

            if (!userExists) {
                const us = await userRepository.createNewAudience(
                    value.email,
                    value.device ?? device
                );
                // await mailchimpContactsService.createUserAudience(
                //     normalizeEmail(value.email)
                // );
                if (us) {
                    await redis.publish(
                        "mattermost:userregistration",
                        JSON.stringify({
                            message: `New email registered : ${value.email}, device: ${value.device ?? device}`,
                        })
                    );
                }
            } else {
                await userRepository.deleteAudience(value.email);
            }
            render(res, 200, statuscodes.OK, { userExists: userExists });
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    confirm: async (req, res) => {
        var token = "";
        if (typeof req.body.token !== "undefined") {
            token = req.body.token;
        }

        const schema = Joi.object({
            token: Joi.string().min(4).required(),
        });

        let payload = schema.validate(req.body);
        if (payload.error !== undefined) {
            render(res, 404, statuscodes.TOKEN_NOT_FOUND, {});
            return;
        }
        try {
            let temp = await prisma.user.findFirst({
                where: {
                    verificationToken: token,
                },
                include: {
                    account: true,
                },
            });

            if (temp === null) {
                render(res, 400, statuscodes.TOKEN_NOT_FOUND, payload);
                return;
            }

            let dateNow = new Date();
            let tmpDate = Date.parse(temp.verificationTokenExpires);
            let dateDiff = tmpDate - dateNow;

            if (dateDiff < 0) {
                render(res, 400, statuscodes.TOKEN_EXPIRED, {});
                return;
            }

            let verified = temp.verified;
            if (verified) {
                render(res, 409, statuscodes.USER_ALREADY_CONFIRMED, {});
                return;
            }

            await prisma.user.update({
                where: {
                    id: temp.id,
                },
                data: {
                    verified: true,
                    verificationToken: null,
                    verificationTokenExpires: null,
                },
            });

            if (temp.account.status === 0) {
                await verifyAccount(temp.accountId);
            }

            let user = await findBasicUserById(temp.id);

            render(res, 200, statuscodes.OK, user);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    forgotPass: async (req, res) => {
        const schema = Joi.object({
            email: Joi.string().email().required(),
        });

        let payload = schema.validate(req.body);
        if (payload.error !== undefined) {
            render(res, 400, statuscodes.VALIDATION_ERROR, payload);
            return;
        }

        const resetToken = crypto.randomBytes(16).toString("hex");
        try {
            const user = await prisma.user.findFirst({
                where: {
                    canonicalEmail: normalizeEmail(req.body.email),
                },
            });

            if (user === null) {
                render(res, 200, statuscodes.USER_NOT_FOUND, {});
                return;
            }

            await prisma.user.update({
                where: {
                    id: user.id,
                },
                data: {
                    resetToken: resetToken,
                    resetTokenExpires: getExpiration(),
                },
            });

            sendLocalTemplateEmail(
                "Forgot password",
                [user.email],
                "forgot.html",
                {
                    link: process.env.FRONTEND_URL + "/forgot/" + resetToken,
                }
            );

            render(res, 200, statuscodes.OK, {});
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    setPass: async (req, res) => {
        var token = "";
        if (typeof req.body.token !== "undefined") {
            token = req.body.token;
        }
        var password = "";
        if (typeof req.body.password !== "undefined") {
            password = req.body.password;
        }
        const schema = Joi.object({
            token: Joi.string().min(4).required(),
            password: Joi.string().min(4).required(),
        });

        let payload = schema.validate({
            token: token,
            password: password,
        });
        if (payload.error !== undefined) {
            render(res, 400, statuscodes.VALIDATION_ERROR, payload);
            return;
        }

        try {
            let passwordHash = Bcrypt.hashSync(password, 10);
            const user = await prisma.user.findFirst({
                where: {
                    resetToken: token,
                },
            });

            if (user === null) {
                render(res, 400, statuscodes.TOKEN_NOT_FOUND, {});
                return;
            }

            let dateNow = new Date();
            let tmpDate = Date.parse(user.resetTokenExpires);
            let dateDiff = tmpDate - dateNow;
            if (dateDiff < 0) {
                render(res, 200, statuscodes.TOKEN_EXPIRED, {});
                return;
            }

            await prisma.user.update({
                where: {
                    resetToken: token,
                },
                data: {
                    password: passwordHash,
                    resetToken: null,
                    resetTokenExpires: null,
                },
            });

            render(res, 200, statuscodes.OK, {});
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    //todo do we need this
    logout: async (req, res) => {
        try {
            const { body } = req;

            await redis.publish(
                "mattermost:userloggedout",
                JSON.stringify({
                    message: `${req.user.email} logged off`,
                })
            );

            render(res, 200, statuscodes.OK, {
                msg: "This feature has not been developed yet",
            });
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 404, statuscodes.DB_ERROR, {});
        }
    },

    resendConfirmationEmail: async (res, req) => {
        try {
            var email = "";
            if (typeof req.body.email !== "undefined") {
                email = req.body.email;
            }

            if (email === "") {
                render(res, 200, statuscodes.USER_NOT_FOUND, {});
                return;
            }

            const user = await prisma.user.findFirst({
                where: {
                    canonicalEmail: normalizeEmail(email),
                },
            });

            if (user === null) {
                render(res, 400, statuscodes.USER_NOT_FOUND, {});
                return;
            } else if (user.verified) {
                render(res, 400, statuscodes.USER_ALREADY_CONFIRMED, {});
                return;
            }

            let verificationToken = crypto.randomBytes(16).toString("hex");
            await prisma.user.updateMany({
                where: {
                    email: email,
                    verified: false,
                },
                data: {
                    verificationToken: verificationToken,
                    verificationTokenExpires: getExpiration(),
                },
            });

            sendLocalTemplateEmail("Confirm account", [email], "confirm.html", {
                link:
                    process.env.FRONTEND_URL +
                    "/redirect/confirmation/" +
                    verificationToken,
            });

            render(res, 200, statuscodes.OK, {});
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 404, statuscodes.DB_ERROR, {});
        }
    },

    requestLogin: async (req, res) => {
        try {
            const schema = Joi.object({
                email: Joi.string().email().required(),
                device: Joi.string(),
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            const { "user-agent": userAgent } = req.headers;
            const device = useragent.parse(userAgent).device.toString();

            let user = await findAnyUserByEmail(value.email);
            if (user === null) {
                const us = await userRepository.createNewAudience(
                    value.email,
                    value.device ?? device
                );
                // await mailchimpContactsService.createUserAudience(value.email);
                if (us) {
                    console.log('publish')
                    await redis.publish(
                        "mattermost:userregistration",
                        JSON.stringify({
                            message: `New email registered : ${value.email}, device: ${value.device ?? device}`,
                        })
                    );
                }
                render(res, 404, statuscodes.USER_NOT_FOUND, {});
                return;
            }

            if (
                user.canonicalEmail === "farhan.almasyhur+gpt15@mediatropy.com"
            ) {
                let loginPin = 1607;
                let loginToken = crypto.randomBytes(16).toString("hex");
                await createLoginCredentials(user.id, loginPin, loginToken);
                render(res, 200, statuscodes.OK, {});
                return;
            }

            let loginPin = generatePin.random(1000, 10000);
            let loginToken = crypto.randomBytes(16).toString("hex");
            await createLoginCredentials(user.id, loginPin, loginToken);

            // await sendLocalTemplateEmail("Login to Eureka", [value.email], "login.html", {
            //     link: process.env.FRONTEND_URL + "/redirect/confirmation/" + loginToken,
            //     pin: loginPin
            // })
            const { id: userId, accountId } = user;
            await mailchimpEmailService.sendLoginEmail(
                value.email,
                user.firstname,
                loginPin
            );
            await logService.createMailLog(req, {
                userId,
                accountId,
                type: MailLogType.LOGIN_PIN,
                message: "Sent mail of Request Login with PIN",
            });
            render(res, 200, statuscodes.OK, {});
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 400, statuscodes.DB_ERROR, {});
        }
    },

    loginUsingEmail: async (req, res) => {
        try {
            const schema = Joi.object({
                email: Joi.string().email().required(),
                token: Joi.string().required(),
                fcmToken: Joi.string().optional().allow(null).allow(""),
                timezone: Joi.string().optional().allow("").allow(null),
            });

            const { "user-agent": userAgent } = req.headers;
            const device = useragent.parse(userAgent).os.family;

            const { error, value } = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            let user = await findAnyUserByEmail(value.email);
            if (user === null) {
                render(res, 404, statuscodes.USER_NOT_FOUND, {});
                return;
            }

            if (user.loginToken !== value.token) {
                render(res, 400, statuscodes.INVALID_TOKEN, {});
                return;
            } else if (new Date() > user.loginTokenExpires) {
                render(res, 400, statuscodes.TOKEN_EXPIRED, {});
                return;
            }

            await verifyUser(user.id);
            await lastLoginUpdate(user.id);
            await editDeviceUser(user.id, device);
            await userRepository.updateUserData(
                user.id,
                value.fcmToken,
                value.timezone
            );

            let token = jwt.sign(
                {
                    data: {
                        id: user.id,
                        accountId: user.account.id,
                        expiresIn: "30d",
                    },
                },
                process.env.JWT_SECRET,
                { expiresIn: "30d" }
            );

            user = await findBasicUserById(user.id);
            user.token = token;

            render(res, 200, statuscodes.OK, user);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 400, statuscodes.DB_ERROR, {});
        }
    },

    loginPin: async (req, res) => {
        try {
            const schema = Joi.object({
                email: Joi.string().email().required(),
                pin: Joi.number().min(0).max(10000),
                fcmToken: Joi.string().optional().allow(null).allow(""),
                timezone: Joi.string().optional().allow("").allow(null),
            });

            const { "user-agent": userAgent } = req.headers;
            const device = useragent.parse(userAgent).os.family;

            console.log(device, "Device user");

            const { error, value } = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            let user = await findAnyUserByEmail(value.email);
            if (user === null) {
                render(res, 404, statuscodes.USER_NOT_FOUND, {});
                return;
            }

            if (user.loginPin !== value.pin) {
                render(res, 400, statuscodes.INVALID_PIN, {});
                return;
            } else if (new Date() > user.loginTokenExpires) {
                render(res, 400, statuscodes.TOKEN_EXPIRED, {});
                return;
            }

            await verifyUser(user.id);
            await lastLoginUpdate(user.id);
            await editDeviceUser(user.id, device);
            await userRepository.updateUserData(
                user.id,
                value.fcmToken,
                value.timezone
            );

            let token = jwt.sign(
                {
                    data: {
                        id: user.id,
                        accountId: user.account.id,
                        expiresIn: "30d",
                    },
                },
                process.env.JWT_SECRET,
                { expiresIn: "30d" }
            );

            user = await findBasicUserById(user.id);
            user.token = token;

            await redis.publish(
                "mattermost:userloggedin",
                JSON.stringify({
                    user: req.user,
                    message: `Existing user logged in : ${user.email}`,
                })
            );

            render(res, 200, statuscodes.OK, user);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 400, statuscodes.DB_ERROR, {});
        }
    },

    switchUser: async (req, res) => {
        try {
            const schema = Joi.object({
                fcmToken: Joi.string().optional().allow(null).allow(""),
                timezone: Joi.string().optional().allow("").allow(null),
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }
            let user = await findUserById(parseInt(id));
            if (user === null) {
                render(res, 404, statuscodes.USER_NOT_FOUND, {});
                return;
            }

            await verifyUser(user.id);
            await lastLoginUpdate(user.id);
            await editDeviceUser(user.id, device);
            if (value.fcmToken && value.timezone)
                await updateUserData(user.id, value.fcmToken, value.timezone);

            let token = jwt.sign(
                {
                    data: {
                        id: user.id,
                        accountId: user.account.id,
                        expiresIn: "30d",
                    },
                },
                process.env.JWT_SECRET,
                { expiresIn: "30d" }
            );

            user = await findBasicUserById(user.id);
            user.token = token;

            render(res, 200, statuscodes.OK, user);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 400, statuscodes.DB_ERROR, {});
        }
    },

    getLoginUser: async (req, res) => {
        try {
            const user = await findBasicUserById(req.user.id);
            user.token = req.headers["authorization"];
            const fcmtoken = req.headers["x-fcmtoken"];
            const timezone = req.headers["x-timezone"];
            if (fcmtoken && timezone) {
                await userRepository.updateUserData(
                    user.id,
                    fcmtoken,
                    timezone
                );
            }
            render(res, 200, statuscodes.OK, user);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    checkStripeVisibility: async (req, res) => {
        try {
            const stripeEnabled = await getStripeVisibilityForUser();
            render(res, 200, statuscodes.OK, stripeEnabled);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    createNewUser: async (req, res) => {
        try {
            const schema = Joi.object({
                firstname: Joi.string().required(),
                email: Joi.string().email().required(),
                birthday: Joi.date(),
                languageId: Joi.number(),
                talkMethod: Joi.string(),
                transactionId: Joi.string(),
                dailyRecap: Joi.boolean(),
                social: Joi.array().items(Joi.number()),
                fcmToken: Joi.string().optional().allow(null).allow(""),
                timezone: Joi.string().optional().allow(null).allow(""),
                paymentMethod: Joi.string(),
                receipt: Joi.string().required(),
                isTrialing: Joi.boolean().required(),
                planId: Joi.number().required(),
            });
            const { "user-agent": userAgent } = req.headers;
            const device = useragent.parse(userAgent).os.family;

            const { error, value } = schema.validate(req.body);

            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            const plan = await planRepository.getPlanById(value.planId);
            const startDate = dayjs();
            let endDate;
            if (value.isTrialing) {
                switch (plan.trialPeriod) {
                    case TrialPeriod.THREEDAYS:
                        endDate = startDate.add(3, "day");
                        break;
                    case TrialPeriod.SEVENDAYS:
                        endDate = startDate.add(7, "day");
                        break;
                }
            } else {
                switch (plan.type) {
                    case PlanType.MONTHLY:
                        endDate = startDate.add(1, "month");
                        break;
                    case PlanType.YEARLY:
                        endDate = startDate.add(1, "year");
                        break;
                }
            }
            let account = await registerNewAccount({
                status: 1,
                email: value.email,
                planId: value.planId,
                canonicalEmail: normalizeEmail(value.email),
                subscriptionCreatedAt: startDate.toDate(),
                subscriptionCurrentPeriodStart: startDate.toDate(),
                transactionId: value.transactionId,
                subscriptionCurrentPeriodEnd: endDate.toDate(),
                subscriptionStatus: value.isTrialing ? "trialing" : "active",
                paymentSource: value.paymentMethod,
                appleReceipt: value.receipt,
            });
            logService.createTransactionLog({
                data: {
                    accountId: account.id,
                    receipt: value.receipt,
                    transactionId: value.transactionId,
                    planId: value.planId,
                    message: "Create new payment on Account",
                },
                accountId: account.id,
                type: value.paymentMethod,
            });

            let user = await userRepository.registerNewUser(value, account);
            await verifyUser(user.id);
            await lastLoginUpdate(user.id);
            await editDeviceUser(user.id, device);
            await userRepository.deleteAudience(user.email);

            if (value.isTrialing) {
                await mailchimpEmailService.sendWelcomeToFreeTrial(user.email);
                await logService.createMailLog(req, {
                    userId: user.id,
                    accountId: account.id,
                    type: MailLogType.CUSTOMER_CREATED,
                    message: "Sent Welcome Mail as FreeTrial User",
                });
            } else if (!value.isTrialing) {
                await mailchimpEmailService.sendWelcomeAsPaidUser(
                    user.email,
                    user.firstname
                );
                await logService.createMailLog(req, {
                    userId: user.id,
                    accountId: account.id,
                    type: MailLogType.SUBSCRIPTION_PAID_USER,
                    message: "Sent Welcome Mail as Paid User",
                });
            }

            await redis.publish(
                "mattermost:userpayment",
                JSON.stringify({
                    user: user,
                    paymentSource: user.account.paymentSource,
                    plan: `${user.account.Plan.name} ${
                        user.account.Plan.type ?? ""
                    }`,
                    isFreetrial:
                        user.account.subscriptionStatus === "trialing"
                            ? ` (Free Trial)`
                            : ``,
                })
            );

            let token = jwt.sign(
                {
                    data: {
                        id: user.id,
                        accountId: account.id,
                        expiresIn: "30d",
                    },
                },
                process.env.JWT_SECRET,
                { expiresIn: "30d" }
            );

            user.token = token;

            const language = await languageRepository.getLanguagesById(
                value.languageId
            );
            // await mailchimpContactsService.editUserAudience(
            //     normalizeEmail(value.email),
            //     value.firstname,
            //     dayjs(value.birthday).format("MM/DD"),
            //     value.dailyRecap,
            //     language.name,
            //     user.levelId,
            //     value.isTrialing.toString(),
            //     plan.name
            // );

            await languageService.setUserLanguage(user, value.languageId);

            render(res, 200, statuscodes.OK, user);
        } catch (e) {
            console.log(e);
            render(res, 400, statuscodes.BAD_REQUEST, {});
        }
    },

    createSubscriptionNewFlow: async (req, res) => {
        try {
            const schema = Joi.object({
                email: Joi.string().email().required(),
                languageId: Joi.number(),
                transactionId: Joi.string(),
                fcmToken: Joi.string().optional().allow(null).allow(""),
                timezone: Joi.string().optional().allow(null).allow(""),
                paymentMethod: Joi.string(),
                receipt: Joi.string().required(),
                isTrialing: Joi.boolean().required(),
                planId: Joi.number().required(),
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            const plan = await planRepository.getPlanById(value.planId);
            const startDate = dayjs();
            let endDate;
            if (value.isTrialing) {
                switch (plan.trialPeriod) {
                    case TrialPeriod.THREEDAYS:
                        endDate = startDate.add(3, "day");
                        break;
                    case TrialPeriod.SEVENDAYS:
                        endDate = startDate.add(7, "day");
                        break;
                }
            } else {
                switch (plan.type) {
                    case PlanType.MONTHLY:
                        endDate = startDate.add(1, "month");
                        break;
                    case PlanType.YEARLY:
                        endDate = startDate.add(1, "year");
                        break;
                }
            }
            let account = await registerNewAccount({
                status: 1,
                email: value.email,
                planId: value.planId,
                canonicalEmail: normalizeEmail(value.email),
                subscriptionCreatedAt: startDate.toDate(),
                subscriptionCurrentPeriodStart: startDate.toDate(),
                transactionId: value.transactionId,
                subscriptionCurrentPeriodEnd: endDate.toDate(),
                subscriptionStatus: value.isTrialing ? "trialing" : "active",
                paymentSource: value.paymentMethod,
                appleReceipt: value.receipt,
            });

            let loginPin = generatePin.random(1000, 10000);
            let loginToken = crypto.randomBytes(16).toString("hex");

            let userCreated = await userRepository.registerNewUser(
                {
                    email: value.email,
                    loginPin: loginPin,
                    loginToken: loginToken,
                    verified: true,
                },
                account
            );

            let user = await findUserById(userCreated.id);

            if (value.isTrialing) {
                await mailchimpEmailService.sendWelcomeToFreeTrial(user.email);
                await logService.createMailLog(req, {
                    userId: user.id,
                    accountId: account.id,
                    type: MailLogType.CUSTOMER_CREATED,
                    message: "Sent Welcome Mail as FreeTrial User",
                });
            } else if (!value.isTrialing) {
                await mailchimpEmailService.sendWelcomeAsPaidUser(
                    user.email,
                    "!"
                );
                await logService.createMailLog(req, {
                    userId: user.id,
                    accountId: account.id,
                    type: MailLogType.SUBSCRIPTION_PAID_USER,
                    message: "Sent Welcome Mail as Paid User",
                });
            }

            await redis.publish(
                "mattermost:userpayment",
                JSON.stringify({
                    user: user,
                    paymentSource: user.account.paymentSource,
                    plan: `${account.Plan.name} ${
                        account.Plan.type ?? ""
                    }`,
                    isFreetrial:
                        user.account.subscriptionStatus === "trialing"
                            ? ` (Free Trial)`
                            : ``,
                })
            );

            let token = jwt.sign(
                {
                    data: {
                        id: user.id,
                        accountId: user.account.id,
                        expiresIn: "30d",
                    },
                },
                process.env.JWT_SECRET,
                { expiresIn: "30d" }
            );
            user.token = token;
            await languageService.setUserLanguage(user, value.languageId);
            render(res, 200, statuscodes.OK, user);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },

    checkReceiptEmail: async (req, res) => {
        try {
            const schema = Joi.object({
                receipt: Joi.string(),
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }
            const email = await userRepository.findUserEmailByReceipt(
                value.receipt
            );
            if (!email) {
                render(res, 404, statuscodes.ACCOUNT_NOT_FOUND, {});
                return;
            }
            render(res, 200, statuscodes.OK, email);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.INTERNAL_ERROR, {});
        }
    },
};
module.exports = account;
