const { mailLog } = require("../lib-prisma");
const errorlogRepository = require("../repositories/error-log-repository");
const logRepository = require("../repositories/log-repository");

const logService = {

    createLog: async (req, data) => {
        let obj = {
            ...data,
            userId: req.user.id,
            createdAt: new Date(),
        };
        let log = await logRepository.createLogDB(obj);

        return log;
    },
    createErrorLog : async (req, data) => {
        let obj = {
            ...data,
            createdAt : new Date()
        };

        let errorLog = await errorlogRepository.createLogDB(obj)

        return errorLog
    },
    createMailLog : async (req, data) => {
        let MailLog = await logRepository.createMailLog(data)
        return mailLog
    },
    createTransactionLog : async (data) => {
        const objData = {
            data : JSON.stringify(data.data),
            accountId : data.accountId,
            type : data.type
        }
        const transactionLog = await logRepository.addNewTransaction(objData);

        return transactionLog;
    }
}
module.exports = logService;
