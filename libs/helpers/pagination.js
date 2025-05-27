const getPaginationParameters = (req) => {
    const { page = 1, perPage = 10 } = req.query;
    const skip = (page - 1) * perPage;
    const take = parseInt(perPage);

    return {skip, take};
}

module.exports = {getPaginationParameters};