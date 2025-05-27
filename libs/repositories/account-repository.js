const normalizeEmail = require("normalize-email");
const Sentry = require("@sentry/node");
const render = require("../helpers/render");
const statuscodes = require("../helpers/statuscodes");
const prisma = require("../lib-prisma");
const dayjs = require("dayjs");
const registerNewAccount = async (data) => {
    let account = await prisma.account.create({
        data: data,
        select: {
            id: true,
            createdAt: true,
            status: true,
            Plan : true,
            Product : true
        },
    });

    return account;
};

const isAccountEmailExist = async (value, res) => {
    try {
        const canonicalEmail = normalizeEmail(value);

        const count = await prisma.account.count({
            where: {
                canonicalEmail: canonicalEmail,
            },
        });

        if (count > 0) {
            return true;
        } else {
            return false;
        }
    } catch (e) {
        console.error(e);
        Sentry.captureException(e);
        render(res, 500, statuscodes.DB_ERROR, {});
    }
};

const findAccountByEmail = async (email) => {
    let result = await prisma.account.findFirst({
        where: {
            canonicalEmail: normalizeEmail(email),
            status: 1,
        },
        include: {
            User: true,
        },
    });
    return result;
};

const verifyAccount = async (accountId) => {
    let account = await prisma.account.update({
        where: {
            id: accountId,
        },
        data: {
            status: 1,
        },
        select: {
            id: true,
            createdAt: true,
            status: true,
        },
    });

    return account;
};

const editAccount = async (accountId, data) => {
    let updatedAccount = await prisma.account.update({
        where: {
            id: parseInt(accountId),
        },
        data: data,
        include: {
            Plan: true,
            Product: {
                include: {
                    Prices: true,
                },
            },
        },
    });

    return updatedAccount;
};

const findAccountByCustomerId = async (customerId) => {
    let account = await prisma.account.findFirst({
        where: {
            customerId: customerId,
        },
    });

    return account;
};

const accountDetail = async (accountId) => {
    let account = await prisma.account.findFirst({
        where: {
            id: accountId,
        },
        include: {
            Product: {
                include: {
                    Prices: true,
                },
            },
            Plan: true,
        },
    });

    return account;
};

const getManyTrialing = async () => {
    let many = await prisma.account.count({
        where: {
            subscriptionStatus: "trialing",
        },
    });
    console.log(many, "User on trialing");
    if (many <= 100) return true;
    else return false;
};

const updateSubscription = async (id) => {
    const update = await prisma.account.update({
        where: {
            id,
        },
        data: {
            planId: null,
            productId: null,
            subscriptionCreatedAt: null,
            subscriptionCurrentPeriodEnd: null,
            subscriptionCurrentPeriodStart: null,
            paymentSource: null,
        },
    });

    return update;
};
const cancelAppleSubsription = async (transactionId) => {
    const update = await prisma.account.update({
        where: {
            transactionId,
        },
        data: {
            planId: null,
            productId: null,
            subscriptionCreatedAt: null,
            subscriptionCurrentPeriodEnd: null,
            subscriptionCurrentPeriodStart: null,
            paymentSource: null,
            canceled_at: dayjs().toDate(),
            cancel_at: dayjs().toDate(),
            subscriptionStatus: "canceled",
        },
        include: {
            Plan: true,
            Product: true,
            User: true,
        },
    });

    return update;
};

const updateAccountLastActivity = async (id) => {
    await prisma.account.update({
        where: {
            id,
        },
        data: {
            lastActivity: dayjs().toDate(),
        },
    });
};

const getAccountByTransactionId = async (transactionId) => {
    const account = await prisma.account.findFirst({
        where: {
            transactionId,
        },
        include: {
            User: true,
            Plan: true,
            Product: true,
        },
    });

    return account;
};

module.exports = {
    isAccountEmailExist,
    cancelAppleSubsription,
    findAccountByEmail,
    registerNewAccount,
    verifyAccount,
    editAccount,
    findAccountByCustomerId,
    accountDetail,
    getManyTrialing,
    updateSubscription,
    updateAccountLastActivity,
    getAccountByTransactionId,
};
