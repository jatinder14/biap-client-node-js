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
      const order = await OrderMongooseModel.findOne({id: orderId})
      console.log('order', order)
      console.log('order.feedback_send', order.feedback_send)
      if (!order) {
        throw new Error(`Order with id ${orderId} not found`);
      }
     if(order.feedback_send){
       task.stop()
     }
     else{
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

     }
    } catch (error) {
      console.error("Error in cron job:", error);
    }
  });
  task.start();
}
