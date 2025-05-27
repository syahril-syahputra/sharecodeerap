const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Pubsub = require("@google-cloud/pubsub");
const redis = require("../../lib-ioredis");
const {
    cancelAppleSubsription,
    getAccountByTransactionId,
} = require("../../repositories/account-repository");
const { getPlanBySubscriptionId } = require("../../repositories/plan-repository");
const { createTransactionLog } = require("../../service/logService");
const { PaymentSource } = require("@prisma/client");
const logService = require("../../service/logService");

module.exports = googlePlayWebhook = async (req, res) => {
    try {
        console.log(req.body.toString("utf-8"), "to String utf-8");
        console.log(req.body, "Buffer");
        const { message } = JSON.parse(req.body.toString("utf-8"));
        const rawData = Buffer.from(message.data, "base64").toString("utf-8");
        const data = rawData ? JSON.parse(rawData) : {};
        const type = data.subscriptionNotification?.notificationType;
        const purchaseToken = data.subscriptionNotification?.purchaseToken;
        const subscriptionId = data.subscriptionNotification?.subscriptionId;
        const account = await getAccountByTransactionId(purchaseToken);
        const plan = await getPlanBySubscriptionId(subscriptionId)
        switch (type) {
            case 1:
                console.log(
                    "SUBSCRIPTION_RECOVERED - A subscription was recovered from account hold."
                );
                break;
            case 2:
                console.log(
                    "SUBSCRIPTION_RENEWED - An active subscription was renewed."
                );
                break;
            case 3:
                const update = await handleCancelSubscription(
                    transaction.transactionId
                );
                await redis.publish(
                    "mattermost:usercancelation",
                    JSON.stringify({
                        user: update.User[0],
                        plan: update?.Plan?.name
                            ? update?.Plan?.name
                            : update?.Product?.name,
                        paymentSource: update?.paymentSource,
                    })
                );

                await createNewTransaction({
                    data : data.subscriptionNotification,
                    accountId : account.id
                });

                console.log(
                    "SUBSCRIPTION_CANCELED - A subscription was either voluntarily or involuntarily cancelled."
                );
                break;
            case 4:
                const accountSubsPurchase = await getAccountByTransactionId(purchaseToken);
                
                if (accountSubsPurchase.subscriptionStatus === "trialing") {
                    await redis.publish(
                        "mattermost:userfreetrialupgrade",
                        JSON.stringify({
                            message: `${account.email} Upgrade free-trial to ${plan.name}`,
                        })
                    );
                } else {
                    await redis.publish(
                        "mattermost:userupgradeplan",
                        JSON.stringify({
                            message: `${account.email} Upgraded ${account.Plan ? account.Plan?.name : account.Product?.name} to ${plan.name}`,
                        })
                    );
                }

                await createNewTransaction({
                    data : data.subscriptionNotification,
                    accountId : accountSubsPurchase.id
                });

                console.log(
                    "SUBSCRIPTION_PURCHASED - A new subscription was purchased."
                );
                break;
            case 5:
                console.log(
                    "SUBSCRIPTION_ON_HOLD - A subscription has entered account hold (if enabled)."
                );
                break;
            case 6:
                console.log(
                    "SUBSCRIPTION_IN_GRACE_PERIOD - A subscription has entered grace period (if enabled)."
                );
                break;
            case 7:
                console.log(
                    "SUBSCRIPTION_RESTARTED - User has restored their subscription from Play > Account > Subscriptions."
                );
                break;
            case 8:
                console.log(
                    "SUBSCRIPTION_PRICE_CHANGE_CONFIRMED - A subscription price change has successfully been confirmed by the user."
                );
                break;
            case 9:
                console.log(
                    "SUBSCRIPTION_DEFERRED - A subscription's recurrence time has been extended."
                );
                break;
            case 10:
                console.log(
                    "SUBSCRIPTION_PAUSED - A subscription has been paused."
                );
                break;
            case 11:
                console.log(
                    "SUBSCRIPTION_PAUSE_SCHEDULE_CHANGED - A subscription pause schedule has been changed."
                );
                break;
            case 12:
                console.log(
                    "SUBSCRIPTION_REVOKED - A subscription has been revoked from the user before the expiration time."
                );
                break;
            case 13:
                const account = await getAccountByTransactionId(purchaseToken);
                if (account.subscriptionStatus === "trialing") {
                    await redis.publish(
                        "mattermost:userfreetrialexpired",
                        JSON.stringify({
                            message: `${account.email} Free trial expired`,
                        })
                    );
                    await logService.createTransactionLog({
                        accountId: account.id, 
                        type: PaymentSource.GOOGLE, 
                        data: {
                                message: "User Subscription Expired",
                            }
                        });
                }
                console.log(
                    "SUBSCRIPTION_EXPIRED - A subscription has expired."
                );
                break;
            default:
                console.log("Unknown notification type:", notificationType);
                break;
        }

        render(res, 200, statuscodes.OK, {});
    } catch (e) {
        console.error(e);
        render(res, 500, statuscodes.INTERNAL_ERROR, {});
    }
};

const handleCancelSubscription = async (transactionId) => {
    try {
        const result = await cancelAppleSubsription(transactionId);
        return result;
    } catch (e) {
        console.error(e);
    }
};

const createNewTransaction = async (data) => {
    return await createTransactionLog({
        type : PaymentSource.GOOGLE,
        data : data.data,
        accountId : data.accountId
    }) 
}