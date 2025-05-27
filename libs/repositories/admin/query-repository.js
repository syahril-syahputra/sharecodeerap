const Sentry = require("@sentry/node");
const prisma = require("../../lib-prisma");

const queryRepository = {
    getQueriesPaginated: async (paginationParameters) => {
        try {
            const queries = await prisma.adminQuery.findMany({
                include: {
                    Condition: true,
                },
                ...paginationParameters,
            });

            const numQueries = await prisma.adminQuery.count();

            return {
                queries: queries,
                pagination: { ...paginationParameters, total: numQueries },
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    createQuery: async (data) => {
        try {
            let query = await prisma.adminQuery.create({
                data,
            });

            return query;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    editQuery: async (data, queryId) => {
        try {
            let query = await prisma.adminQuery.update({
                where: {
                    id: queryId,
                },
                data: data,
            });

            return query;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    deleteConditions: async (id) => {
        try {
            const res = await prisma.adminQueryCondition.delete({
                where: {
                    id,
                },
            });

            const filter = await prisma.adminQueryCondition.findMany({
                where: {
                    queryId: res.queryId,
                },
            });

            const count = await prisma.user.count({
                where: dynamicWhereClause(filter),
            });

            const update = await prisma.adminQuery.update({
                where: {
                    id: res.queryId,
                },
                data: {
                    userTarget: count,
                },
            });

            return res;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    deleteQuery: async (queryId) => {
        try {
            const social = await prisma.adminQuery.delete({
                where: {
                    id: queryId,
                },
            });

            return social;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getAllQueryFields: async (q) => {
        try {
            const fields = await getModelFields("User", q);
            const language = await prisma.language.findMany({
                select: {
                    id: true,
                    name: true,
                },
            });
            const userLevel = await prisma.userLevel.findMany({
                select: {
                    id: true,
                    name: true,
                },
            });

            return {
                "@": fields,
                "language#": language.map((language) => ({
                    label: language.name,
                    value: `${language.id}`,
                })),
                "userLevel#": userLevel.map((userLevel) => ({
                    label: userLevel.name,
                    value: `${userLevel.id}`,
                })),
                "date#": [],
            };
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    createConditions: async (data, many = false) => {
        try {
            if (many) {
                const res = await prisma.adminQueryCondition.createMany({
                    data,
                });

                const filter = await prisma.adminQueryCondition.findMany({
                    where: {
                        queryId: data[0].queryId,
                    },
                });
                const count = await prisma.user.count({
                    where: dynamicWhereClause(filter),
                });

                const update = await prisma.adminQuery.update({
                    where: {
                        id: data.queryId,
                    },
                    data: {
                        userTarget: count,
                    },
                });
                return res;
            } else {
                const result = await prisma.adminQueryCondition.create({
                    data,
                });

                const filter = await prisma.adminQueryCondition.findMany({
                    where: {
                        queryId: data.queryId,
                    },
                });

                const count = await prisma.user.count({
                    where: dynamicWhereClause(filter),
                });

                const update = await prisma.adminQuery.update({
                    where: {
                        id: data.queryId,
                    },
                    data: {
                        userTarget: count,
                    },
                });

                return result;
            }
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
    getQueryConditions: async (queryId) => {
        try {
            const result = await prisma.adminQueryCondition.findMany({
                where: {
                    queryId,
                },
            });

            return result;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },

    tryRawQuery: async (query) => {
        try {
            let result = await prisma.$queryRawUnsafe(query);
            return result;
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
        }
    },
};
async function getModelFields(modelName, conditions = false) {
    try {
        const tableInfo = await prisma.$queryRaw`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = ${modelName}
      `;
        const modelFields = {};

        for (const row of tableInfo) {
            modelFields[row.column_name] = row.data_type;
        }
        if (conditions) {
            const result = tableInfo.map((row) => ({
                value: row.column_name,
                label: `${row.column_name} (${
                    row.data_type === "tinyint" ? "boolean" : row.data_type
                })`,
            }));

            return result;
        } else {
            return {
                ...modelFields,
            };
        }
    } catch (error) {
        console.error(`Error retrieving info for table ${modelName}:`, error);
        return {};
    }
}

function dynamicWhereClause(conditions) {
    const where = {
        AND: conditions.map((condition) => {
            const { field, condition: op, value } = condition;
            if (op == "startsWith") {
                return { [field]: { startsWith: value } };
            } else if (op == "at") {
                return { [field]: value };
            } else if (op == "gte") {
                return { [field]: { gte: new Date(value) } };
            } else if (op == "lte") {
                return { [field]: { lte: new Date(value) } };
            } else if (op == "endsWith") {
                return { [field]: { startsWith: value } };
            } else if (op == "contain") {
                return { [field]: { contains: `_${value}_` } };
            } else {
                return { [field]: parseInt(value) ? parseInt(value) : value };
            }
        }),
    };
    return conditions.length ? where : {};
}
module.exports = queryRepository;
