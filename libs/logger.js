const prisma = require("./lib-prisma");

module.exports = dblogger;

function dblogger(req, res, next) {
    run().catch(error => console.log(error.stack));
    async function run() {
        try {

            let payload = JSON.stringify(req.body);
            if(req.originalUrl.includes("/login") || req.originalUrl.includes("/register") || req.originalUrl.includes("password")){
                payload = "";
            }
            const temp = await prisma.audit.create({
                data: {
                    route: req.originalUrl,
                    ip: req.clientIp,
                    payload: payload,
                    method: req.method
                }
            })
            await prisma.$disconnect();

        } catch (error) {
            console.error('Unable to connect to the database:', error);
        }
        next();
    }
}