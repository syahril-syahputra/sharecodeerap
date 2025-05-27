const render = require("../../helpers/render");
const statuscodes = require("../../helpers/statuscodes");
const Sentry = require("@sentry/node");
const DailyRecapService = require("../../service/dailyRecapService");
const UserRepository = require("../../repositories/user-repository");
const { sendDailyRecapEmail, sendNewDailyRecapEmail } = require("../../service/mailchimpEmailService");
const dayjs = require("dayjs");
const generateSuggestion = (string) => {
    const list = string.split("\n- ")
    let result = `<div
                        style="
                            background-color: #cbe7fe;
                            display: flex;
                            align-items: center;
                            padding: 10px;
                            justify-items: center;
                        "
                    >
                    ${list.map(item => `<div
                                        style="
                                            background-color: #ffffff;
                                            margin: 0px 10px;
                                            padding: 10px;
                                            flex: 1 1 0%;
                                        "
                                    >${item}
                                </div>`)}
                            </div>`;
    return result;

}
const adminLanguageController = {
    dailyRecap:  async (req, res) => {
        try {

            let user = await UserRepository.findUserById(parseInt(req.params.id));
            if(!user){
                render(res, 400, statuscodes.BAD_REQUEST, {});
                return
            }

            let recap = await DailyRecapService.generateDailyRecap(user);

            render(res, 200, statuscodes.OK, recap);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },
     dailyRecapSend:  async (req, res) => {
        try {
            let user = await UserRepository.findUserById(parseInt(req.params.id));
            if(!user){
                render(res, 400, statuscodes.BAD_REQUEST, {});
                return
            }

            let recap = await DailyRecapService.generateDailyRecap(user);
            const dailyRecap = recap.text.split("\n\n")[0];
            await sendNewDailyRecapEmail(
                user.email,
                user.firstname,
                dayjs().format('MMM, DD YYYY'),
                dailyRecap,
                generateSuggestion(recap.text.split("with Eureka:\n- ")[1]))
            render(res, 200, statuscodes.OK, recap);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            render(res, 500, statuscodes.DB_ERROR, {});
        }
    },

}

module.exports = adminLanguageController;