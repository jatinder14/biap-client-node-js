import loadEnvVariables from './utils/envHelper.js';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser';
import express from "express";
import logger from 'morgan';
// import initializeFirebase from './lib/firebase/initializeFirebase.js';
import logErrors from './utils/logErrors.js';
import router from './utils/router.js';
import dbConnect from './database/mongooseConnector.js';
import mongoSanitize from 'express-mongo-sanitize'
import subscriberRoute from './utils/subscribe.js'
import { schedulerEachDay } from './rsp_integration/rsp_service/crons.js'
import settleRouter from "./settlement/settle.routes.js"
import orderRouter from "./orderDetails/order.routes.js"
import analyticsRouter from "./utils/analytics/router.js"
const app = express();
// import Redis from 'ioredis';
// global.redisCache = new Redis(process.env.BHASHINI_REDIS_PORT,process.env.BHASHINI_REDIS_HOST);


loadEnvVariables();
// initializeFirebase();
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

//
// // Global exception handler for HTTP/HTTPS requests
// app.use(function (err, req, res, next) {
//
//     console.log('err.status==============>',err.status);
//     console.log('err.status==============>',err?.message);
//     console.log('err.status==============>',err?.stack);
//     // Send response status based on custom error code
//     if (err.status) {
//         return res.status(err.status).json({error: err.message});
//     }
//     res.status(500).json({ error: 'Something went wrong. Please try again' });
// });

// app.use(cors());

app.use("/api", settleRouter)
app.use("/api/db/", orderRouter)
app.use("/api/analytics", analyticsRouter)
app.use("/clientApis", router);
app.use("/ondc/onboarding/", subscriberRoute);
app.use(logErrors);
// app.use(logger('dev'));

app.get("*", (req, res) => {
    res.send("API NOT FOUND");
});

app.use((err, req, res, next) => {
    if (err) {
        console.error('err.stack :', err.stack, 'err.message : ', err.message)
        res.status(500).json({ message: 'Internal server error!', success: false })
    } else {
        next()
    }
}
)

const port = process.env.PORT || 8080;

//Setup connection to the database
dbConnect()
    .then((db) => {
        console.log("Database connection successful");
        schedulerEachDay()
        app.listen(port, () => {
            console.log(`Listening on port ${port}`);
        });
    })
    .catch((error) => {
        console.log("Error connecting to the database", error);
        return;
    });
