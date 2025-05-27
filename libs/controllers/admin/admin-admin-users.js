const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const {getAdminUsersPaginated, getAdminUserDetail, createAdminUser, isAdminUserEmailExist, isAdminUserUserNameExist, deleteAdminUserDB, updateAdminUserDB} = require("../../repositories/admin/user-repository");
const Joi = require("joi");


const adminAdminUserController = {
    listAdminUsers:  async (req, res) => {
        try {
            let result = await getAdminUsersPaginated();

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    getAdminUserDetail:  async (req, res) => {
        try {
            let result = await getAdminUserDetail(parseInt(req.params.id));

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    createAdminUser:  async (req, res) => {
        try {
            const schema = Joi.object({
                firstName: Joi.string(),
                lastName: Joi.string(),
                email: Joi.string().email().required(),
                password: Joi.string().min(8).required(),
            });

            const {error, value} = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            const userExists = await isAdminUserEmailExist(value.email, res);
            if (userExists === true) {
                render(res, 200, statuscodes.ADMIN_USER_ALREADY_EXISTS, {});
                return;
            }
            // const userNameExists = await isAdminUserUserNameExist(value.userName, res);
            // if (userNameExists === true) {
            //     render(res, 200, statuscodes.ADMIN_USERNAME_ALREADY_EXISTS, {});
            //     return;
            // }

            let result = await createAdminUser(value);
            render(res, 200, statuscodes.OK, result);
        } catch (e) {

            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    deleteAdminUser:  async (req, res) => {
        try {
            let result = await deleteAdminUserDB(parseInt(req.params.id), res);

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    updateAdminUser:  async (req, res) => {
        try {
            const schema = Joi.object({
                firstName: Joi.string(),
                lastName: Joi.string(),
                password: Joi.string().min(8).optional(),
            });

            const {error, value} = schema.validate(req.body);
            if (error) {
                render(res, 400, statuscodes.VALIDATION_ERROR, error);
                return;
            }

            let result = await updateAdminUserDB(req.params.id, value, res);
            render(res, 200, statuscodes.OK, result);
        } catch (e) {

            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
}

module.exports = adminAdminUserController;