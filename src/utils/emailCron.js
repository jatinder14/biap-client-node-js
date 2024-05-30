import { sendEmail } from "../shared/mailer.js";
import OrderMongooseModel from "../order/v1/db/order.js";
import cron from "cron";

export async function emailCronJob(
  userEmails,
  orderId,
  HTMLtemplate,
  userName,
  subject
) {
  const CronJob = cron.CronJob;

  const task = new CronJob("*/15 * * * * *", async () => {
    try {
      await sendEmail({
        userEmails,
        orderIds: orderId,
        HTMLtemplate,
        userName,
        subject,
      });

      const updatedOrder = await OrderMongooseModel.findOneAndUpdate(
        { id: orderId },
        { $set: { feedback_send: true } },
        { new: true }
      );

      if (updatedOrder && updatedOrder.feedback_send === true) {
        task.stop();
        console.log("Cron job stopped");
      }
    } catch (error) {
      console.error("Error in cron job:", error);
    }
  });
  task.start();
}
