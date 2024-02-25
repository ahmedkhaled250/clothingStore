import nodemailer from "nodemailer";
async function sendEmail({to , cc, bcc, subject, message, attachments = [] } = {}) {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.nodeMailerEmail, // generated ethereal user
            pass: process.env.nodeMailerPassword, // generated ethereal password
        },
    });
    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: `"Ahmed 👻" <${process.env.nodeMailerEmail}>`, // sender address
        to,
        cc,
        bcc,
        subject,
        html:message,
        attachments
    });
    return info.rejected.length ? false : true
}



export default sendEmail