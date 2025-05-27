const statuscodes = require('../helpers/statuscodes');
const render = require('../helpers/render');

const redirectController = {
    confirmEmail: async (req, res) => {
        try {
            let token = req.params.token;
            if (token) {
    
                if (req.useragent.isMobile === true) {
                    res.writeHead(301, { 'Location': 'eureka://confirmation/token?token=' + token });
                    res.end();
                }
                else {
                    res.send('Please open this on your mobile device where you have the app installed.')
                }
                return;
            }
        } catch (e) {
            render(res, 404, statuscodes.NO_TOKEN_PROVIDED, {});
        }
    },

    loginWithEmail: async (req, res) => {

        try {
            let token = req.params.token;
            if (token) {
    
                if (req.useragent.isMobile === true) {
                    res.writeHead(301, { 'Location': 'eureka://login/token?token=' + token });
                    res.end();
                }
                else {
                    res.send('Please open this on your mobile device where you have the app installed.')
                }
                return;
            }
        } catch (e) {
            render(res, 404, statuscodes.NO_TOKEN_PROVIDED, {});
        }

    }

};

module.exports = redirectController;

