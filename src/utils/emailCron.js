import { CronJob } from "cron";
import OrderMongooseModel from "../order/v1/db/order.js";
import { sendEmail } from "../shared/mailer.js";

export const emailschedulerEachDay = () => {
  new CronJob(
    "*/2 * * * *",
    async () => {
      try {
        const order = await OrderMongooseModel.aggregate([
          {
            $match: {
              state: "Completed",
              feedback_sent: false,
            },
          },
        ]);
        if (!order || order.length == 0) {
          return 
        } else {
          const orderData = order.map((data) => ({
            orderIDs: data?.id,
            userEmail: data?.customer?.contact?.email,
            userName: data?.customer?.person?.name,
          }));

          const orderIDsArray = orderData.map((item) => item.orderIDs);
          const userEmailArray = orderData.map((item) => item.userEmail);
          const userNameArray = orderData.map((item) => item.userName);

          await sendEmail({
            userEmails: userEmailArray,
            orderIds: orderIDsArray,
            HTMLtemplate: "/template/orderFeedback.ejs",
            userName: userNameArray,
            subject: "Order Feedback | Tell us about your experience",
          });

          await OrderMongooseModel.updateMany(
            { id: { $in: orderIDsArray } },
            { $set: { feedback_sent: true } }
          );
        }
      } catch (e) {
        console.log("e", e);
      }
    },
    null,
    true,
    "Asia/Calcutta"
  );
};
