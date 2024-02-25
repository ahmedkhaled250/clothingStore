import userModel from "../../DB/models/User.js";
import { customAlphabet } from "nanoid";
import { hash } from "./HashAndCompare.js";
import { create, find, findById, findOne} from "../../DB/DBMethods.js";
import sendEmail from "./sendEmail.js";
const superAdminFunction = async () => {
  const checkUser = await find({
    model: userModel,
    condition: { role: "SuperAdmin" },
  });
  if (checkUser.length) {
    return 0;
  }
  const email = "ahmedkhaled56745@gmail.com";

  const password =
    customAlphabet("ASDFGHJKLQWERTYUIOPZXCVBNM", 1)() +
    customAlphabet("qwertyuioplkjhgfdsambnvcxz", 3)() +
    customAlphabet("!@#$%^&*", 1)() +
    customAlphabet("123456789", 4)();
  const hashPassword = hash({ plaintext: password });

  const message = `<!DOCTYPE html>
  <html>
  <head>
      <link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/font-awesome/4.7.0/css/font-awesome.min.css"></head>
  <style type="text/css">
  body{background-color: #88BDBF;margin: 0px;}
  </style>
  <body style="margin:0px;"> 
  <table border="0" width="50%" style="margin:auto;padding:30px;background-color: #F3F3F3;border:1px solid #630E2B;">
  <tr>
  <td>
  <table border="0" width="100%">
  <tr>
  <td>
  <h1>
      <img width="100px" src="https://res.cloudinary.com/ddajommsw/image/upload/v1670702280/Group_35052_icaysu.png"/>
  </h1>
  </td>
  <td>
  <p style="text-align: right;"><a href="http://localhost:4200/#/" target="_blank" style="text-decoration: none;">View In Website</a></p>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  <tr>
  <td>
  <table border="0" cellpadding="0" cellspacing="0" style="text-align:center;width:100%;background-color: #fff;">
  <tr>
  <td style="background-color:#630E2B;height:100px;font-size:50px;color:#fff;">
  <img width="50px" height="50px" src="${process.env.logo}">
  </td>
  </tr>
  <tr>
  <td>
  <h1 style="padding-top:25px; color:#630E2B">  Your password is : ${password}</h1>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  <tr>
  <td>
  <table border="0" width="100%" style="border-radius: 5px;text-align: center;">
  <tr>
  <td>
  <h3 style="margin-top:10px; color:#000">Stay in touch</h3>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </body>
  </html>`;
  await sendEmail({
    to: email,
    subject: "Your password",
    message,
  });
  await create({
    model: userModel,
    data: {
      userName: "Ahmed Khaled",
      email,
      password: hashPassword,
      role: "SuperAdmin",
      confirmEmail: true,
    },
  });
};
export default superAdminFunction;
