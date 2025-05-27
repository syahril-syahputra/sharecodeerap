const statuscodes = require('../../helpers/statuscodes');
const Sentry = require("@sentry/node");
const render = require('../../helpers/render');
const jwt = require('jsonwebtoken');
const Joi = require("joi");
const {findAdminUserByEmailOrUsername, findAdminUserById, isAdminUserEmailExist, createAdminUserInvite} = require("../../repositories/admin-repository");
const Bcrypt = require("bcryptjs");
const crypto = require("crypto");
const {sendLocalTemplateEmail} = require("../../helpers/aws-ses");
const adminAuth = {
    login: async (data, res) => {
        try {
            const schema = Joi.object({
                email: Joi.string().required(),
                password: Joi.string().required(),
            });
            const {error, value} = schema.validate(data);
            console.log(value)

            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            let user = await findAdminUserByEmailOrUsername(value.email);
            if (user === null) {
                render(res, 200, statuscodes.USER_NOT_FOUND, {});
                return;
            }

            const isAuthenticated = Bcrypt.compareSync(value.password, user.password);
            if (!isAuthenticated) {
                render(res, 200, statuscodes.USER_NOT_FOUND, {});
                return;
            }

            let token = jwt.sign({
                data: {
                    'isAdmin': true,
                    'id': user.id
                }
            }, process.env.JWT_SECRET, {expiresIn: '30d'});

            user = await findAdminUserById(user.id);
            user.token = token;

            render(res, 200, statuscodes.OK, user);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 400, statuscodes.DB_ERROR, {});
        }
    },

    invite: async (req, res) => {
        try {

            const schema = Joi.object({
                email: Joi.string().email().required(),
            });

            const {error, value} = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            const userExists = await isAdminUserEmailExist(value.email, res);
            if (userExists) {
                render(res, 200, statuscodes.USER_ALREADY_EXISTS, {});
                return;
            }

            let password = crypto.randomBytes(16).toString("hex");
            let user = await createAdminUserInvite(value, password);

            await sendLocalTemplateEmail("Admin invite", [value.email], "admin-invite.html", {
                password: password,
            })

            render(res, 200, statuscodes.OK, user);
        } catch (e) {
            console.log(e)
            render(res, 400, statuscodes.BAD_REQUEST, {});
        }
    },

};
module.exports = adminAuth;


