const templateHelper = {

    replacePlaceholders: (template, data) => {

            const regex = /{{(.*?)}}/g;
            const replacedTemplate = template.replace(regex, (match, key) => {
                const keys = key.split('.');
                let value = data;
                for (const k of keys) {
                    if (value.hasOwnProperty(k)) {
                        value = value[k];
                    } else {
                        return match;
                    }
                }
                return value;
            });
            return replacedTemplate;

    }

}
module.exports = templateHelper;