const crypto = require("crypto");

const StringService = {

    generateRandomDigits: async (length) => {
        let tmp_str = "";
        for (let x = 0; x < length; x++) {
            tmp_str += crypto.randomInt(0, 10);
        }
        return tmp_str;
    },

    cleanString: (str) => {
        let result = str.replace(/(\r\n|\n|\r)/gm, "");

        return result;
    },

    containsOnlyArrayOfStrings: (obj) => {
        console.log(obj);
        if (!Array.isArray(obj)) {
            console.log("is not array")
            return false;
        }

        return obj.every((element) => typeof element === 'string');
    }

}
module.exports = StringService;
