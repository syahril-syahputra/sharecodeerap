const crypto = require('crypto');

const mailChimpHelper = {

    generateMD5Hash: (data) => {
        const hash = crypto.createHash('md5');
        hash.update(data);
        return hash.digest('hex');
    }

}
module.exports = mailChimpHelper;