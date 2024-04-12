import * as nodemailer from 'nodemailer';
import ejs from 'ejs';
import fs from 'fs';
import path from 'path';

const user = process.env.EMAIL_ADDRESS;
const pass = process.env.EMAIL_PASSWORD;


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: user,
        pass: pass
    }
});

// Function to send notification
export async function sendEmail({ userEmail, orderId, userName }) {
    try {

        // Resolve the absolute path to the EJS template (assuming it's named template.ejs)
        const templatePath = path.join(new URL(import.meta.url).pathname, '..', 'template.ejs');

        // Read the EJS template file
        const template = fs.readFileSync(templatePath, 'utf8');

        // Render the EJS template
        const html = ejs.render(template, { orderId, userName });

        // Email options
        const mailOptions = {
            from: user,
            to: userEmail,
            subject: "Order has been placed",
            html: html
        };

        // Send email
        await transporter.sendMail(mailOptions);
        console.log('Email sent successfully');
    } catch (error) {
        console.log('Error sending email:', error);
    }
}
