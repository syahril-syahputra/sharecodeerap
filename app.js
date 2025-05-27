const express = require("express");
const jwt = require("jsonwebtoken");
var app = express();

const bodyParser = require("body-parser");
const cors = require("cors");
const compress = require("compression")();

var useragent = require("express-useragent");

const admin = require("./routes/admin/route-admin");

const debug = require("./routes/route-debug");
const routeAuth = require("./routes/route-auth");
const routeAccount = require("./routes/route-account");
const routeUser = require("./routes/route-user");
const routeGPT = require("./routes/route-gpt");
const routeStripe = require("./routes/route-stripe");
const routeLanguage = require("./routes/route-language");
const routeSettings = require("./routes/route-settings");
const routeQuiz = require("./routes/route-quiz");
const routeActivities = require("./routes/route-activities");
const routeTopics = require("./routes/route-topics");
const routeFaq = require("./routes/route-faq");
const routePois = require("./routes/route-pois");
const routeJoin = require("./routes/route-join");
const routePoints = require("./routes/route-points");
const routeSocial = require("./routes/route-social");
const routeProduct = require("./routes/route-product");
const routeLevels = require("./routes/route-user-levels");
const routePredefinedQuestion = require("./routes/route-predefinedQuestion");
const routePrompt = require("./routes/route-prompt");
const routeNewsletter = require("./routes/route-newsletter");
const routeTTS = require("./routes/route-tts");
const routeWaitlist = require("./routes/route-waitlist");
const routeStoryParams = require("./routes/route-storyParams");
const routeTypeOfStory = require("./routes/route-typeOfStory");
const routeSavedStories = require("./routes/route-savedStories");
const routeFollowStory = require("./routes/route-followStory");
const routeNotifications = require("./routes/route-notifications");
const routePlan = require("./routes/route-plan");
const requestIp = require("request-ip");
const Sentry = require("@sentry/node");
const { PubSub } = require('@google-cloud/pubsub')
var path = require("path");
var rfs = require("rotating-file-stream");
var morgan = require("morgan");
const routeRedirect = require("./routes/route-redirect");

// const { pipeline } = require('stream');
// const { promisify } = require('util');
// const pipelineAsync = promisify(pipeline);

const Graceful = require("@ladjs/graceful");
const pubsub = new PubSub();
const Bree = require("bree");
const firebaseWebhook = require("./libs/controllers/google-play/firebase-crashlytics");
const webhookController = require("./libs/controllers/stripe/webhook");
const appStoreWebhook = require("./libs/controllers/apple-store/webhook");
const googlePlayBillingWebhook = require("./libs/controllers/google-play/webhook");
const bree = new Bree({
    logger: false,
    jobs: [
        // runs `./jobs/close-session-job.js` on start and every 5 minutes
        {
            name: "close-session-job",
            interval: "1m",
        },
    ],
});

// handle graceful reloads, pm2 support, and events like SIGHUP, SIGINT, etc.
const graceful = new Graceful({ brees: [bree] });
graceful.listen();
(async () => {
    await bree.start();
})();

global.__basedir = __dirname + "/";

// create a rotating write stream
var accessLogStream = rfs.createStream("access.log", {
    interval: "1d", // rotate daily
    path: path.join(__dirname, "log"),
});

if (process.env.ENVIRONMENT !== "local") {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
        integrations: [
            // enable HTTP calls tracing
            new Sentry.Integrations.Http({ tracing: false }),

            // enable Express.js middleware tracing
            // new Tracing.Integrations.Express({app}),
        ],

        // Set tracesSampleRate to 1.0 to capture 100%
        // of transactions for performance monitoring.
        // We recommend adjusting this value in production
        // tracesSampleRate: 1.0,
        environment: process.env.ENVIRONMENT,
        enabled: process.env.ENVIRONMENT !== "local",
    });
}

app.use(morgan("combined", { stream: accessLogStream }));
if (process.env.ENVIRONMENT !== "local") {
    app.use(Sentry.Handlers.requestHandler());
}

// TracingHandler creates a trace for every incoming request
// app.use(Sentry.Handlers.tracingHandler());



app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);
// app.use(bodyParser.raw({type: '*/*', limit: '20mb'}));

app.post(
    "/stripe/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
        await webhookController.stripeWebhook(req, res);
    }
);


app.post("/appstore/webhook", express.raw({ type: "application/json" }), async (req, res) => {
        await appStoreWebhook(req, res);
    }
);

app.post("/google/playbilling", express.raw({ type: "application/json" }), async (req, res) => {
        await googlePlayBillingWebhook(req, res);
    }
);

app.post("/crashlytics", express.raw({type : 'application/json'}), async (req, res) => {
    await firebaseWebhook(req, res);
})
// APP STORE SERVER NOTIFICATIONS

// app.post(
//     "/appstore",
//     express.raw({ type: "application/json" }),
//     async (req, res) => {
//         await webhookController.appstoreWebhook(req, res);
//     }
// )

// ===========================================================================

// app.use(helmet());// adds security headers

app.use(cors({ origin: true }));

app.use(compress, bodyParser.json());
app.use(requestIp.mw());
// app.use(dblogger);
app.use(useragent.express());

app.use("/public", express.static(path.join(__dirname, "public")));

app.get("/.well-known/assetlinks.json", async (req, res) => {
    res.end(
        JSON.stringify([
            {
                relation: ["delegate_permission/common.handle_all_urls"],
                target: {
                    namespace: "android_app",
                    package_name: "com.mediatropy.eureka",
                    sha256_cert_fingerprints: [
                        "A2:BB:41:85:11:4D:0B:B3:77:E3:DB:8B:0F:E5:3C:9C:83:9A:D9:B7:46:9D:8B:6D:24:D0:D6:01:C4:97:DD:0F",
                    ],
                },
            },
        ])
    );
});

app.get("/", async (req, res) => {
    res.end(JSON.stringify({ hello: "WORLD7" }));
});

// ADMIN AREA
app.use("/admin", admin);
app.use("/debug", debug);

app.use("/account", routeAccount);
app.use("/user", routeUser);
app.use("/points", routePoints);
app.use("/gpt", routeGPT);
app.use("/tts", routeTTS);
app.use("/stripe", routeStripe);
app.use("/language", routeLanguage);
app.use("/settings", routeSettings);
app.use("/pois", routePois);
app.use("/activities", routeActivities);
app.use("/quiz", routeQuiz);
app.use("/topics", routeTopics);
app.use("/faq", routeFaq);
app.use("/join", routeJoin);
app.use("/product", routeProduct);
app.use("/prompt", routePrompt);
app.use("/level", routeLevels);
app.use("/questions", routePredefinedQuestion);
app.use("/social", routeSocial);
app.use("/redirect", routeRedirect);
app.use("/story-params", routeStoryParams);
app.use("/waitlist", routeWaitlist);
app.use("/newsletter", routeNewsletter);
app.use("/type-of-story", routeTypeOfStory);
app.use("/saved-stories", routeSavedStories);
app.use("/follow-story", routeFollowStory);
app.use("/notifications", routeNotifications)
app.use("/plan", routePlan);
app.use("/", routeAuth);

const http = require("http");
const server = http.createServer(app);
const port = process.env.PORT;

server.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
