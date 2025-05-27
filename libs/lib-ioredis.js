require("dotenv-safe").config({ allowEmptyValues: true });
const Redis = require("ioredis");
const redis = new Redis({
    host: process.env.REDISHOST,
    port: process.env.REDISPORT,
    password: process.env.REDISPASS,
    showFriendlyErrorStack: true,
});

module.exports = redis;
