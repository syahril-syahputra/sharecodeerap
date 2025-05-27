const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const {
    decodeTransaction,
    decodeNotificationPayload,
    decodeRenewalInfo,
} = require("app-store-server-api");
const {
    updateSubscription,
    cancelAppleSubsription,
} = require("../../repositories/account-repository");
const redis = require("../../lib-ioredis");
const { PaymentSource } = require("@prisma/client");
const { createTransactionLog } = require("../../service/logService");
const logService = require("../../service/logService");

module.exports = appstoreWebhook = async (req, res) => {
    try {
        const requestData = req.body;
        const { signedPayload } = JSON.parse(requestData.toString("utf-8"));
        const payload = await decodeNotificationPayload(signedPayload);
        console.log("========payload=======");
        console.log(payload);
        console.log("========payload=======");
        const transaction = await decodeTransaction(
            payload.data.signedTransactionInfo
        );
        const renewalInfo = await decodeRenewalInfo(
            payload.data.signedRenewalInfo
        );

        console.log(transaction, "transaction");
        console.log(renewalInfo, "renewalInfo");

        //! Need to check the account transactionId or the renewalId
        //! Payload has no specific identifier for the users, only contains transaction data and renewal data
        //! Renewal is always has the same transactionId, and a new transaction which is means upgrade/downgrade &
        //! re-buy the subscription will has a different transactionId

        /**
         * TODO :
         * - add new table to trace users transaction/renewal (maybe using NoSql database will be a GoodChoice for this because it can be used too for google-play-billings)
         * - find a same transactionId/renewalId from payload and database
         * - if not found, create new transaction/renewal
         * - if found, update transaction/renewal
         * - notify to mattermost about the transaction/renewal
         */

        switch (transaction.type) {
            case "DID_CHANGE_RENEWAL_STATUS":
                // Handle renewal status change
                console.log("Subscription Renewal Status Change:", requestData);
                break;

            case "DID_CHANGE_EXPIRED_STATUS":
                // Handle expired status change
                const accountExpired = await getAccountByTransactionId(renewalInfo?.originalTransactionId ?? transaction?.transactionId);
                if (accountExpired.subscriptionStatus === "trialing") {
                    await redis.publish(
                        "mattermost:userfreetrialexpired",
                        JSON.stringify({
                            message: `${accountExpired.email} Free trial expired`,
                        })
                    );
                }

                console.log("Subscription Expired Status Change:", requestData);
                break;

            case "INTERACTIVE_RENEWAL":
                //   Handle user interaction for renewal
                console.log("Interactive Renewal:", requestData);
                break;

            case "CANCEL":
                // Handle subscription cancellation
                const { account, update } = await handleCancelSubscription(
                    transaction.transactionId
                );
                await redis.publish(
                    "mattermost:usercancelation",
                    JSON.stringify({
                        user: account.User[0],
                        plan: account?.Plan?.name
                            ? account?.Plan?.name
                            : account?.Product?.name,
                        paymentSource: account?.paymentSource,
                    })
                );
                await logService.createTransactionLog({
                    accountId: account, 
                    type: PaymentSource.APPLE, 
                    data: {
                            message: "User Subscription Expired",
                        }
                    });
                console.log("Subscription Canceled:", requestData);
                break;

            case "REVOKE":
                // Handle subscription revocation
                console.log("Subscription Revoked:", requestData);
                break;

            case "RENEWAL":
                // Handle subscription renewal
                console.log("Subscription Renewed:", requestData);
                break;

            case "INITIAL_BUY":
                // Handle initial purchase
                
                const accountSubsPurchase = await getAccountByTransactionId(renewalInfo?.originalTransactionId ?? transaction?.transactionId);
                
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
                    data : {
                        ...payload,
                        transactionInfo : await decodeTransaction(
                            payload.data.signedTransactionInfo
                        ), 
                        renewalInfo : await decodeRenewalInfo(
                            payload.data.signedRenewalInfo
                        )
                    },
                    accountId : accountSubsPurchase.id
                });


                console.log("Initial Purchase:", requestData);
                break;

            case "DID_CHANGE_RENEWAL_PREF":
                // Handle renewal preference change
                console.log("Renewal Preference Change:", requestData);
                break;

            default:
                // Handle unrecognized notification types
                console.log(
                    "Received an unrecognized notification:",
                    requestData
                );
                break;
        }

        render(res, 200, statuscodes.OK, {});
    } catch (error) {
        console.error("Error processing App Store notification:", error);
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
        type: PaymentSource.APPLE,
        data: data.data,
        accountId: data.accountId,
    });
};
