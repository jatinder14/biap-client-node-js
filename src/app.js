import loadEnvVariables from './utils/envHelper.js';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import express from "express";
import logger from 'morgan';
import initializeFirebase from './lib/firebase/initializeFirebase.js';
import logErrors from './utils/logErrors.js';
import router from './utils/router.js';
import dbConnect from './database/mongooseConnector.js';
import mongoSanitize from 'express-mongo-sanitize'
import subscriberRoute from './utils/subscribe.js'
import { schedulerEachDay } from './rsp_integration/rsp_service/crons.js'
import {emailschedulerEachDay} from "./utils/emailCron.js"
import settleRouter from "./settlement/settle.routes.js"
import lokiLogger from './utils/logger.js';
// import analyticsRouter from "./utils/analytics/router.js"
const app = express();
// import Redis from 'ioredis';
// global.redisCache = new Redis(process.env.BHASHINI_REDIS_PORT,process.env.BHASHINI_REDIS_HOST);


loadEnvVariables();
initializeFirebase();
//app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(bodyParser.json());

app.use(
    mongoSanitize({
        onSanitize: ({ req, key }) => {
            console.warn(`This request[${key}] is sanitized`, req);
        },
    }),
);
app.use(logger("combined"));

// app.use(cors());

app.use("/api", settleRouter)
// app.use("/api/db/", orderRouter)
// app.use("/api/analytics", analyticsRouter)
app.use("/clientApis", router);
app.use("/ondc/onboarding/", subscriberRoute);
app.use(logErrors);
// app.use(logger('dev'));

app.get("/health", (req,res) => {
    res.send({ success: true, message: "HEALTH CHECK - Server is Running" })
})

app.get("*", (req, res) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.status(404).send({ success: true, message: "Invalid Endpoint, please re-confirm!"});
});

app.use((err, req, res, next) => {
    if (err) {
        lokiLogger.error(`Error -->> `, err?.message)
        res.header("Access-Control-Allow-Origin", "*");
        res.status(500).json({ message: 'We encountered an unexpected error while processing your request, Please try again later.', success: false })
    } else {
        next()
    }
})

const port = process.env.PORT || 8080;

//Setup connection to the database
dbConnect()
    .then((db) => {
        console.log("Database connection successful");
        schedulerEachDay()
        emailschedulerEachDay()
        app.listen(port, () => {
            lokiLogger.info(`Connected successfully on port ${port}`)
            console.log(`Listening on port ${port}`);
        });
    })
    .catch((error) => {
        console.log("Error connecting to the database", error);
        return;
    });
