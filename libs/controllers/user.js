const Joi = require("joi");
const statuscodes = require("../helpers/statuscodes");
const render = require("../helpers/render");
const {
    isUserEmailExist,
    existUserByName,
    createUser,
    createUserInvite,
    findUserByInviteToken,
    countRemainingAdminUsers,
    createUserFromInviteConfirm,
    findUserByIdAndAccount,
    findBasicUserById,
    deleteUser,
    countUsersPerAccount,
    editUser,
    setAdmin,
    getAllUsersSwitchProfile,
    editLanguageUser,
    editRecapSettingUser,
    findUserById,
} = require("../repositories/user-repository");
const PromptRepository = require("../repositories/prompt-repository");
const UserLevelService = require("../service/userLevelsService");
const { languageExists } = require("../repositories/language-repository");
const { sendLocalTemplateEmail } = require("../helpers/aws-ses");
const TalkMethod = require("../helpers/talk-method");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const logService = require("../service/logService");
const { LogType, MailLogType } = require("@prisma/client");
const mailchimpContactsService = require("../service/mailchimpContactsService");
const languageRepository = require("../repositories/language-repository");
const normalizeEmail = require("normalize-email");
const { sendInvitePeople } = require("../service/mailchimpEmailService");
const voiceLanguageRepository = require("../repositories/voiceLanguage-repository");
const sessionRepository = require("../repositories/session-repository");
const redis = require("../lib-ioredis");
const languageService = require("../service/languageService");
const { getUserLevelTier0 } = require("../repositories/user-level-repository");
const elevenLabServices = require("../service/elevenLabService");

const userController = {
    create: async (req, res) => {
        try {
            const schema = Joi.object({
                firstname: Joi.string().required(),
                fcmToken: Joi.string().optional().allow(null).allow(""),
                lastname: Joi.string(),
                pin: Joi.number(),
                timezone: Joi.string().optional().allow(null).allow(""),
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            const userExists = await existUserByName(
                req.user.accountId,
                value.firstname,
                value.lastname
            );
            if (userExists) {
                render(res, 200, statuscodes.USER_ALREADY_EXISTS, {});
                return;
            }

            let user = await createUser(value, req.user.account);

            console.log(user);

            await logService.createLog(req, {
                type: LogType.CREATE_USER,
                message: `Create new user with id : ${user.id}`,
            });

            render(res, 200, statuscodes.OK, user);
        } catch (e) {
            console.log(e);
            render(res, 400, statuscodes.BAD_REQUEST, {});
        }
    },

    invite: async (req, res) => {
        try {
            const { firstname: name } = req.user;
            const schema = Joi.object({
                email: Joi.string().email().required(),
                isAdmin: Joi.boolean(),
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            const userExists = await isUserEmailExist(value.email, res);
            if (userExists) {
                render(res, 200, statuscodes.USER_ALREADY_EXISTS, {});
                return;
            }

            let inviteToken = crypto.randomBytes(16).toString("hex");
            let user = await createUserInvite(
                value,
                req.user.account,
                inviteToken
            );

            // sendLocalTemplateEmail("Eureka invite", [value.email], "invite.html", {
            //     link: process.env.FRONTEND_URL + "/invite/" + inviteToken,
            // })
            const { id: userId, accountId } = req.user;
            await logService.createLog(req, {
                type: LogType.INVITE_USER,
                message: `Invite user with mail : ${value.email}`,
            });
            await logService.createMailLog(req, {
                userId,
                accountId,
                type: MailLogType.INVITE_USER,
                message: "Invite user",
            });
            const sendMail = await sendInvitePeople(value.email, name);

            render(res, 200, statuscodes.OK, user);
        } catch (e) {
            console.log(e);
            render(res, 400, statuscodes.BAD_REQUEST, {});
        }
    },

    inviteConfirm: async (req, res) => {
        try {
            const schema = Joi.object({
                inviteToken: Joi.string().required(),
                firstname: Joi.string().required(),
                lastname: Joi.string(),
                password: Joi.string().min(4).required(),
                pin: Joi.number(),
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            let user = await findUserByInviteToken(value.inviteToken);
            if (!user) {
                render(res, 400, statuscodes.TOKEN_NOT_FOUND, {});
                return;
            }

            const userExists = await existUserByName(
                req.user.accountId,
                value.firstname,
                value.lastname
            );
            if (userExists) {
                render(res, 200, statuscodes.USER_ALREADY_EXISTS, {});
                return;
            }

            let dateNow = new Date();
            let tmpDate = Date.parse(user.verificationTokenExpires);
            let dateDiff = tmpDate - dateNow;
            if (dateDiff < 0) {
                render(res, 400, statuscodes.TOKEN_EXPIRED, {});
                return;
            }

            await createUserFromInviteConfirm(user, value);
            user = await findBasicUserById(user.id);

            await logService.createLog(req, {
                type: LogType.INVITE_USER_CONFIRM,
                message: `Confirm invite user with id : ${user.id}`,
            });

            render(res, 200, statuscodes.OK, user);
        } catch (e) {
            console.log(e);
            render(res, 400, statuscodes.BAD_REQUEST, {});
        }
    },

    getTokenForUser: async (req, res) => {
        try {
            const schema = Joi.object({
                userId: Joi.number().required(),
                pin: Joi.number(),
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            let user = await findUserByIdAndAccount(
                value.userId,
                req.user.accountId
            );
            if (!user) {
                render(res, 400, statuscodes.USER_NOT_FOUND, {});
                return;
            } else if (!user.verified) {
                render(res, 400, statuscodes.USER_NOT_VERIFIED, {});
                return;
            } else if (user.pin != null && user.pin !== value.pin) {
                render(res, 400, statuscodes.INVALID_PIN, {});
                return;
            }
            delete user.pin;

            user.token = jwt.sign(
                {
                    data: {
                        id: user.id,
                        accountId: req.user.account.id,
                    },
                },
                process.env.JWT_SECRET,
                { expiresIn: "30d" }
            );

            render(res, 200, statuscodes.OK, user);
        } catch (e) {
            console.log(e);
            render(res, 400, statuscodes.BAD_REQUEST, {});
        }
    },

    getProfile: async (req, res) => {
        try {
            let user = await findBasicUserById(req.user.id);

            await logService.createLog(req, {
                type: LogType.GET_PROFILE,
                message: `Get user profile`,
            });

            render(res, 200, statuscodes.OK, user);
        } catch (e) {
            console.log(e);
            render(res, 400, statuscodes.BAD_REQUEST, {});
        }
    },
    deleteUser: async (req, res) => {
        try {
            let user = await findUserByIdAndAccount(
                parseInt(req.params.id),
                req.user.accountId
            );
            if (!user) {
                render(res, 400, statuscodes.USER_NOT_FOUND, {});
                return;
            } else if (user.id !== req.user.id && !req.user.isAdmin) {
                render(res, 400, statuscodes.NOT_ALLOWED, {});
                return;
            }

            let numUsers = await countUsersPerAccount(req.user.accountId);
            if (numUsers <= 1) {
                render(res, 400, statuscodes.LAST_USER_IN_ACCOUNT, {});
                return;
            } else if (user.isAdmin) {
                let remainingAdmins = await countRemainingAdminUsers(
                    req.user.accountId,
                    user.id
                );
                if (remainingAdmins <= 1) {
                    render(res, 400, statuscodes.LAST_ADMIN_IN_ACCOUNT, {});
                    return;
                }
            }

            await deleteUser(parseInt(req.params.id));

            await logService.createLog(req, {
                type: LogType.DELETE_USER,
                message: `Delete user with id : ${req.params.id}`,
            });

            render(res, 200, statuscodes.OK, {});
        } catch (e) {
            console.log(e);
            render(res, 400, statuscodes.BAD_REQUEST, {});
        }
    },

    editUser: async (req, res) => {
        try {
            const schema = Joi.object({
              firstname: Joi.string(),
              lastname: Joi.string().allow(null, ""),
              pin: Joi.number(),
              birthday: Joi.date(),
              languageId: Joi.number(),
              talkMethod: Joi.string(),
              dailyRecap: Joi.boolean(),
              weeklyRecap: Joi.boolean(),
              social: Joi.array().items(Joi.number()),
              fcmToken: Joi.string().optional().allow(null).allow(""),
              timezone: Joi.string().optional().allow(null).allow(""),
              voiceCode: Joi.string().optional().allow(null).allow(""),
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }
            console.log(value.talkMethod);
            let user = await findUserByIdAndAccount(
                parseInt(req.params.id),
                req.user.accountId
            );
            if (!user) {
                render(res, 400, statuscodes.USER_NOT_FOUND, {});
                return;
            } else if (user.id !== req.user.id && !req.user.isAdmin) {
                render(res, 400, statuscodes.NOT_ALLOWED, {});
                return;
            }

            if (value.languageId !== undefined) {
                if (!(await languageExists(value.languageId))) {
                    render(res, 400, statuscodes.INVALID_LANGUAGE, {});
                    return;
                }
            }

            if (value.talkMethod && value.talkMethod !== user.talkMethod) {
                if (
                    value.talkMethod !== TalkMethod.Tap &&
                    value.talkMethod !== TalkMethod.Hold
                ) {
                    render(res, 400, statuscodes.INVALID_TALK_METHOD, {});
                    return;
                }

                await redis.publish(
                    "mattermost:userchangetalkmethod",
                    JSON.stringify({
                        message: `${user.email} change Talk Method to : ${value.talkMethod}`,
                    })
                );
            }

            if (value.voiceCode && value.voiceCode !== user.voiceCode) {
                const voices = await elevenLabServices.getAvailableVoices();
                const matchingVoice = voices.find(voice => voice.voice_id === value.voiceCode);
    
                if (matchingVoice) {
                    const name = matchingVoice.name;
                    await redis.publish(
                        "mattermost:userchangetalkmethod",
                        JSON.stringify({
                            message: `${user.email} changed Voice Selection to: ${name}`,
                        })
                    );
                }
            }


            let language = await languageRepository.getLanguagesById(
                value.languageId
            );
            const birthdayObj = new Date(value.birthday);
            await editUser(req.params.id, value, user);

            if (user.email) {
                // await mailchimpContactsService.editUserAudience(
                //     normalizeEmail(user.email),
                //     user.firstname,
                //     [birthdayObj.getMonth() + 1, birthdayObj.getDate()].join(
                //         "/"
                //     ),
                //     value.dailyRecap,
                //     language.name,
                //     user.userLevelId
                // );
            }

            await logService.createLog(req, {
                type: LogType.EDIT_USER,
                message: `Update data user with id : ${req.params.id}`,
            });
            const response = await findBasicUserById(user.id);
            render(res, 200, statuscodes.OK, response);
        } catch (e) {
            console.log(e);
            render(res, 400, statuscodes.BAD_REQUEST, {});
        }
    },

    setUserAdmin: async (req, res) => {
        try {
            const schema = Joi.object({
                isAdmin: Joi.boolean(),
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            let user = await findUserByIdAndAccount(
                parseInt(req.params.id),
                req.user.accountId
            );
            if (!user) {
                render(res, 400, statuscodes.USER_NOT_FOUND, {});
                return;
            } else if (!req.user.isAdmin) {
                render(res, 400, statuscodes.NOT_ALLOWED, {});
                return;
            } else if (!value.isAdmin) {
                let remainingAdmins = await countRemainingAdminUsers(
                    req.user.accountId,
                    user.id
                );
                if (remainingAdmins <= 0) {
                    render(res, 400, statuscodes.LAST_ADMIN_IN_ACCOUNT, {});
                    return;
                }
            }

            await setAdmin(req.params.id, value.isAdmin);

            await logService.createLog(req, {
                type: LogType.SET_USER_ADMIN,
                message: `Set user into Admin with id : ${req.params.id}`,
            });

            render(res, 200, statuscodes.OK, {});
        } catch (e) {
            console.log(e);
            render(res, 400, statuscodes.BAD_REQUEST, {});
        }
    },
    getAllUser: async (req, res) => {
        try {
            const users = await getAllUsersSwitchProfile(req.user.accountId);

            render(res, 200, statuscodes.OK, users);
        } catch (e) {
            console.log(e);
            render(res, 400, statuscodes.BAD_REQUEST, {});
        }
    },
    changeUserLanguage: async (req, res) => {
        try {
            const schema = Joi.object({
                languageId: Joi.number().required(),
            });
            // console.log(req.user)
            const { error, value } = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            const language = await languageService.setUserLanguage(
              req.user,
              value.languageId
            );

            let lastSession = await sessionRepository.getLastUserSession(
                req.user
            );

            let lastProcessPrompt =
                await sessionRepository.getLastProcessedPrompt(req.user.id);
            if (lastSession) {
                let closedSession = await sessionRepository.closeSession(
                    lastSession,
                    lastProcessPrompt
                );
            }

            await redis.publish(
                "mattermost:userchangelanguage",
                JSON.stringify({
                    message: `${req.user.email} change language to : ${language.name}`,
                })
            );

            render(res, 200, statuscodes.OK, {});
        } catch (e) {
            console.log(e);
            render(res, 400, statuscodes.BAD_REQUEST, {});
        }
    },
    recapUserUpdate: async (req, res) => {
        try {
            const { id } = req.params;
            const schema = Joi.object({
                dailyRecap: Joi.boolean(),
                weeklyRecap: Joi.boolean(),
            });

            const { error, value } = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            const { dailyRecap, weeklyRecap } = value;

            const data = {
                dailyRecap,
                weeklyRecap,
            };

            if (dailyRecap) {
                await redis.publish(
                    "mattermost:useractivedaily",
                    JSON.stringify({
                        message: `${user.email} Activated daily recap`,
                    })
                );
            } else {
                await redis.publish(
                    "mattermost:userdeactivedaily",
                    JSON.stringify({
                        user: req.user,
                        message: `${user.email} Deactivated daily recap`,
                    })
                );
            }

            const edit = await editRecapSettingUser(parseInt(id), data);

            render(res, 200, statuscodes.OK, {});
        } catch (e) {}
    },
    userOpenedApp: async (req, res) => {
        try {
            const schema = Joi.object({
                version: Joi.string().allow(null).allow(""),
            });
            const { error, value } = schema.validate(req.body);

            await logService.createLog(req, {
                type: LogType.USER_OPENED_APP,
                message: `User opened the app : ${req.user.id}`,
            });
            await redis.publish(
                "mattermost:useropenedapp",
                JSON.stringify({
                    message: `${req.user.email} opened the app ${value.version ? `(V.${value.version})` : ""}`,
                })
            );
            render(res, 200, statuscodes.OK, {});
        } catch (e) {}
    },
};

module.exports = userController;
