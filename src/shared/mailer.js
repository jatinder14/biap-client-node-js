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
    export async function sendEmail({ userEmails, orderIds, HTMLtemplate, userName, subject, itemName, itemQuantity, itemPrice, estimatedDelivery }) {
        try {

            // Resolve the absolute path to the EJS template (assuming it's named template.ejs)
            const templatePath = new URL(`.${HTMLtemplate}`, import.meta.url).pathname;

            // Read the EJS template file
            const template = fs.readFileSync(templatePath, 'utf8');
    
            // Convert userEmails and orderIds to arrays if they are strings
            if (typeof userEmails === 'string') {
                userEmails = [userEmails];
            }
            if (typeof orderIds === 'string') {
                orderIds = [orderIds];
            }
    
            // Loop through each email address and order id and send the email individually
            for (let i = 0; i < userEmails.length; i++) {
                const userEmail = userEmails[i];
                const orderId = orderIds[i]; // Get the corresponding orderId
    
                // Render the EJS template for each user
                const html = ejs.render(template, { orderId, userName, itemName, itemQuantity, itemPrice, estimatedDelivery });
    
                // Email options
                const mailOptions = {
                    from: user,
                    to: userEmail,
                    subject: subject,
                    html: html
                };
    
                // Send email
                await transporter.sendMail(mailOptions);
            }
    
            console.log('Emails sent successfully');
        } catch (error) {
            console.log('Error sending emails:', error);
        }
    }
    