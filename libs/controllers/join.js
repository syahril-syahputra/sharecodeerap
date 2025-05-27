const statuscodes = require('../helpers/statuscodes');
const Sentry = require("@sentry/node");
const render = require('../helpers/render');
const ejs = require("ejs");
const InviteLinkRepository = require("../repositories/admin/invite-link-repository");

module.exports = {
    joinPage: async (req, res) => {

        let token = req.params.token;

        const inviteLink = await InviteLinkRepository.findOneBySlugDetailed(token)
        if(!inviteLink) {
            let result = await ejs.renderFile(process.cwd() + '/templates/web/error.html', {
                message: "This link is invalid.",
            });
            res.send(result);
            return;
        }

        let inviteExpires = new Date(inviteLink.inviteExpires);
        if (inviteExpires < new Date()) {
            let result = await ejs.renderFile(process.cwd() + '/templates/web/error.html', {
                message: "This link has already expired.",
            });
            res.send(result);
            return;
        }

        if(inviteLink.allowedNumberOfUsers <= inviteLink.User.length) {
            let result = await ejs.renderFile(process.cwd() + '/templates/web/error.html', {
                message: "This link has already expired.",
            });
            res.send(result);
            return;
        }

        const stripe = require('stripe')(process.env.STRIPE_SK);
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            line_items: [
                {
                    price: inviteLink.Product.default_price,
                    quantity: 1,
                },
            ],
            success_url: inviteLink.successCallbackUrl,
            cancel_url: process.env.FRONTEND_URL + '/public/cancel.html',
            // customer_email : user.email,
            allow_promotion_codes: false,
            consent_collection: {
                terms_of_service: 'required',
            },
            subscription_data: {
                trial_settings: {
                    end_behavior: {
                        missing_payment_method: 'cancel',
                    },
                },
                trial_period_days: inviteLink.numDaysTrial,
                metadata: {
                    inviteLink: inviteLink.id,
                },
            },
            metadata: {
                inviteLink: inviteLink.id,
            },
            payment_method_collection: 'if_required',
        });

        // render(res, 200, statuscodes.OK, session.url);
        res.redirect(session.url);
    },
}


