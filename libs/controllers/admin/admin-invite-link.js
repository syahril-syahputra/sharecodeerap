const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const {getPaginationParameters} = require("../../helpers/pagination");
const InviteLinkRepository = require("../../repositories/admin/invite-link-repository");

const adminInviteLinkController = {

    createInviteLink:  async (req, res) => {
        try {

            const isExist = await InviteLinkRepository.findOneBySlug(req.body.slug)
            if(isExist) {
                render(res, 400, statuscodes.ALREADY_EXISTS, {});
                return;
            }

            let inviteExpires = new Date(req.body.inviteExpires);
            if (inviteExpires < new Date()) {
                render(res, 400, statuscodes.EXPECTED_FUTURE_DATE, {});
                return;
            }

            let result = await InviteLinkRepository.createInviteLinkDB({...req.body, inviteExpires: inviteExpires});

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    editInviteLink:  async (req, res) => {
        try {
            const isExist = await InviteLinkRepository.findOneById(parseInt(req.params.id))
            if(!isExist) {
                render(res, 400, statuscodes.NOT_FOUND, {});
                return;
            }

            let inviteExpires = new Date(req.body.inviteExpires);
            if (inviteExpires < new Date()) {
                render(res, 400, statuscodes.EXPECTED_FUTURE_DATE, {});
                return;
            }

            let result = await InviteLinkRepository.editInviteLinkDB({...req.body, inviteExpires: inviteExpires}, parseInt(req.params.id))

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

    getInviteLink:  async (req, res) => {
        try {
            let paginationParameters = getPaginationParameters(req);
            let result = await InviteLinkRepository.getInviteLinks(paginationParameters)

            result.inviteLinks = result.inviteLinks.map(x=> {return {...x, numUsers: x.User.length, User: undefined}});

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
    deleteInviteLink:  async (req, res) => {
        try {
            const isExist = await InviteLinkRepository.findOneById(parseInt(req.params.id))
            if(!isExist) {
                render(res, 400, statuscodes.NOT_FOUND, {});
                return;
            }

            let result = await InviteLinkRepository.deleteInviteLinkDB(parseInt(req.params.id));

            render(res, 200, statuscodes.OK, result);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

}

module.exports = adminInviteLinkController;