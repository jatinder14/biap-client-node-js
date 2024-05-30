import { CronJob } from "cron";
import { initiateRsp } from "./prepareRecon.js";
import logger from "../../utils/logger.js";
const isRedisEnabled = process.env.REDIS_SERVICE_ENABLED === "true";

export const schedulerEachDay = () => {
  new CronJob(
    "*/2 * * * *",
    async () => {
      logger.info(`*=== Inside schedulerEachDay ====*`);
      await initiateRsp();
    },
    null,
    true,
    "Asia/Calcutta"
  );
};
