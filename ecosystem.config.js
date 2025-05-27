module.exports = {
    apps: [
        {
            name: "Eureka API",
            script: "./app.js",
            max_memory_restart: "400M",
            watch: true,
            ignore_watch: ["log/*.log", "uploads"],
            log_date_format: "YYYY-MM-DD HH:mm Z",
            rotate_interval: "1d", // Rotate logs every day
        },
        {
            name: "Eureka Scheduler",
            script: "./scheduler.js",
            max_memory_restart: "400M",
            watch: true,
            ignore_watch: ["log/*.log", "public", "uploads"],
        },
        {
            name: "Eureka Pubsub",
            script: "./pubsub.js",
            max_memory_restart: "400M",
            watch: true,
            ignore_watch: ["log/*.log", "public", "uploads"],
        },
    ],
};
