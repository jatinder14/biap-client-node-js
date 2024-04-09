import nodemailer from "nodemailer";
import ejs from "ejs";
import fs from "fs";
import path from "path";


const sendEmail = async ({
  email,
  subject,
  HTMLtemplate,
}) => {
  try {
    const templatePath = path.resolve("Templates", HTMLtemplate);

    const template = fs.readFileSync(templatePath, { encoding: "utf8" });

    const html = ejs.render(template, {
    
    });

    const transporter = nodemailer.createTransport({
      service: "gmail",
      secure: true,
      auth: {
        user: process.env.EMAIL_ADDRESS,
        pass: process.env.EMAIL_PASSWORD,
      },
    });

    await transporter.sendMail({
      from: "Wits Innovation Lab",
      to: email,
      subject: subject,
      html,
    });
    console.log('email sent sucessfully')
  } catch (error) {
    console.log('email not sent')
    console.log(error)
  }
};

export default sendEmail;
