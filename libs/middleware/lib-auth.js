const render = require("../helpers/render");
const statuscodes = require("../helpers/statuscodes");
const Sentry = require("@sentry/node");
const jwt = require("jsonwebtoken");
const {
    findUserById,
    updateLastInteraction,
    deleteAudience,
} = require("../repositories/user-repository");
const { findAdminUserById } = require("../repositories/admin-repository");
const {
    updateAccountLastActivity,
} = require("../repositories/account-repository");
const languageService = require("../service/languageService");

const auth = async (req, res, next) => {
    try {
        const token = req.headers["authorization"];
        if (!token) {
            render(res, 401, statuscodes.TOKEN_NOT_FOUND, {});
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            render(res, 401, statuscodes.UNAUTHORIZED_ACCESS, {});
            return;
        }

        req.userId = decoded.data.id;
        if (!req.userId) {
            render(res, 401, statuscodes.UNAUTHORIZED_ACCESS, {});
            return;
        }

        let user = await findUserById(req.userId);
        if (!user) {
            render(res, 401, statuscodes.USER_NOT_FOUND, {});
            return;
        } else if (!user.verified) {
            render(res, 401, statuscodes.USER_NOT_ENABLED, {});
            return;
        } else if (user.account.status === 0) {
            render(res, 401, statuscodes.ACCOUNT_NOT_ENABLED, {});
            return;
        }

        await deleteAudience(user.email);
            await updateAccountLastActivity(user.account.id);

        if (!user.Language) {
            const language = await languageService.setUserLanguage(user, 38);
            user.languageId = language.id;
            user.Language = language;
        }
            req.user = user;
        next();
    } catch (e) {
        console.error(e);
        // Sentry.captureException(e); //! For a reason the jwt triggers an error so i (Bagus) comment the Sentry
        render(res, 400, statuscodes.UNAUTHORIZED_ACCESS, {});
    }
};

const authAdmin = async (req, res, next) => {
    try {
        const token = req.headers["authorization"];
        if (!token) {
            render(res, 401, statuscodes.TOKEN_NOT_FOUND, {});
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            render(res, 401, statuscodes.UNAUTHORIZED_ACCESS, {});
            return;
        }

        req.userId = decoded.data.id;
        if (!req.userId) {
            render(res, 401, statuscodes.UNAUTHORIZED_ACCESS, {});
            return;
        } else if (!decoded.data?.isAdmin) {
            render(res, 401, statuscodes.UNAUTHORIZED_ACCESS, {});
            return;
        }

        let user = await findAdminUserById(req.userId);
        if (!user) {
            render(res, 401, statuscodes.USER_NOT_FOUND, {});
            return;
        }

        req.user = user;
        next();
    } catch (e) {
        if (e.hasOwnProperty("name") && e.name === "TokenExpiredError") {
            render(res, 401, statuscodes.TOKEN_EXPIRED, {});
            return;
        }
        if (e.hasOwnProperty("name") && e.name === "JsonWebTokenError") {
            render(res, 401, statuscodes.TOKEN_MALFORMED, {});
            return;
        }
        console.error(e);
        Sentry.captureException(e);
        render(res, 500, statuscodes.DB_ERROR, {});
    }
};

const authDebug = async (req, res, next) => {
    try {
        const token = req.headers["authorization"];
        if (!token) {
            render(res, 401, statuscodes.TOKEN_NOT_FOUND, {});
            return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            render(res, 401, statuscodes.UNAUTHORIZED_ACCESS, {});
            return;
        }

        req.userId = decoded.data.id;
        if (!req.userId) {
            render(res, 401, statuscodes.UNAUTHORIZED_ACCESS, {});
            return;
        }

        let user = await findUserById(req.userId);
        if (!user) {
            render(res, 401, statuscodes.USER_NOT_FOUND, {});
            return;
        } else if (!user.verified) {
            render(res, 401, statuscodes.USER_NOT_ENABLED, {});
            return;
        } else if (user.account.status === 0) {
            render(res, 401, statuscodes.ACCOUNT_NOT_ENABLED, {});
            return;
        }

        const debugToken = req.headers["debugtoken"];
        if (!debugToken) {
            render(res, 401, statuscodes.TOKEN_NOT_FOUND, {});
            return;
        }

        if (debugToken !== process.env.DEBUG_TOKEN) {
            render(res, 401, statuscodes.INVALID_TOKEN, {});
            return;
        }

        req.user = user;
        next();
    } catch (e) {
        console.error(e);
        Sentry.captureException(e);
        render(res, 400, statuscodes.UNAUTHORIZED_ACCESS, {});
    }
};

module.exports = { auth, authAdmin, authDebug };
