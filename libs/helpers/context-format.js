
const contextPromptFormat = (response) => {
    if (!response.Context) {
        response.Context = undefined;
        return response;
    }
    const { context, emoji, title } = response.Context;
    response.Context = undefined;
    response.context = context;
    response.text = {
        emoji: emoji,
        title: title,
    };
    return response;
}

module.exports = contextPromptFormat;