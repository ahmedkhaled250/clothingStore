import userModel from "../../../../DB/models/User.js";
import { customAlphabet } from "nanoid";
import sendEmail from "../../../utils/sendEmail.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
import {
  create,
  findOne,
  findOneAndUpdate,
  updateMany,
} from "../../../../DB/DBMethods.js";
import {
  generateToken,
  verifyToken,
} from "../../../utils/GenerateAndVerifyToken.js";
import { compare, encrypt, hash } from "../../../utils/HashAndCompare.js";
export const signup = asyncHandler(async (req, res, next) => {
  const { userName, password, phone, gender, address, role, DOB } = req.body;
  const email = req.body.email.toLowerCase();
  if (role == "SuperAdmin") {
    return next(
      new Error("You cannot add yourself as SuperAdmin", { cause: 400 })
    );
  }
  const user = await findOne({
    model: userModel,
    condition: { email },
    select: "email",
  });
  if (user) {
    return next(new Error("Email exist", { cause: 409 }));
  }
  const token = generateToken({
    payload: { email },
    signature: process.env.EMAILTOKEN,
    expiresIn: 60 * 5,
  });
  const refreshToken = generateToken({
    payload: { email },
    signature: process.env.EMAILTOKEN,
    expiresIn: 60 * 60 * 24,
  });

  const link = `${req.protocol}://${req.headers.host}/auth/confirmEmail/${token}`;
  const rfLink = `${req.protocol}://${req.headers.host}/auth/refreshEmail/${refreshToken}`;

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
  <h1 style="padding-top:25px; color:#630E2B">Email Confirmation</h1>
  </td>
  </tr>
  <tr>
  <td>
  <p style="padding:0px 100px;">
  </p>
  </td>
  </tr>
  <tr>
  <td>
  <a href="${link}" style="margin:10px 0px 30px 0px;border-radius:4px;padding:10px 20px;border: 0;color:#fff;background-color:#630E2B; ">Verify Email address</a>
  </td>
  </tr>
  <tr>
  <td>
  <br>
  <br>
  <br>
  <br>
  <br>
  <br>
  <br>
  <br>
  <a href="${rfLink}" style="margin:10px 0px 30px 0px;border-radius:4px;padding:10px 20px;border: 0;color:#fff;background-color:#630E2B; ">Request new  email </a>
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
  <tr>
  <td>
  <div style="margin-top:20px;">

  <a href="${process.env.facebookLink}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;color:#fff;border-radius:50%;">
  <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35062_erj5dx.png" width="50px" hight="50px"></span></a>
  
  <a href="${process.env.instegram}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;color:#fff;border-radius:50%;">
  <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35063_zottpo.png" width="50px" hight="50px"></span>
  </a>
  
  <a href="${process.env.twitterLink}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;;color:#fff;border-radius:50%;">
  <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group_35064_i8qtfd.png" width="50px" hight="50px"></span>
  </a>

  </div>
  </td>
  </tr>
  </table>
  </td>
  </tr>
  </table>
  </body>
  </html>`;
  const info = await sendEmail({
    to: email,
    subject: "Confirmation-Email",
    message,
  });
  if (!info) {
    return next(new Error("Email rejected", { cause: 400 }));
  }
  const hashPassword = hash({ plaintext: password });
  const encryptedPhone = encrypt({ phone });
  let newUser;
  if (role == "Admin") {
    newUser = await create({
      model: userModel,
      data: {
        userName,
        email,
        password: hashPassword,
        phone: encryptedPhone,
        address,
        role,
        gender,
        DOB,
        acceptedMail: false,
      },
    });
    await updateMany({
      model: userModel,
      condition: { role: "SuperAdmin" },
      data: { $push: { accountRequested: newUser._id } },
    });
  } else {
    newUser = await create({
      model: userModel,
      data: {
        userName,
        email,
        password: hashPassword,
        phone: encryptedPhone,
        address,
        gender,
        DOB,
      },
    });
  }
  return res.status(201).json({ message: "Done", userId: newUser._id });
});
export const createSuperAdmin = asyncHandler(async (req, res, next) => {
  const { user } = req;
  if (user.deleted) {
    return next(new Error("You deleted your profile", { cause: 400 }));
  }
  if (user.createdBy) {
    return next(
      new Error("You cannot add any account for anyone", { cause: 403 })
    );
  }
  const { userName, phone, gender, address, DOB } = req.body;
  const email = req.body.email.toLowerCase();
  const checkEmail = await findOne({ model: userModel, condition: { email } });
  if (checkEmail) {
    return next(new Error("Email exist", { cause: 409 }));
  }
  const token = generateToken({
    payload: { email },
    signature: process.env.EMAILTOKEN,
    expiresIn: 60 * 60,
  });
  const refreshToken = generateToken({
    payload: { email },
    signature: process.env.EMAILTOKEN,
    expiresIn: 60 * 60 * 48,
  });
  const link = `${req.protocol}://${req.headers.host}/auth/confirmEmail/${token}`;
  const rfLink = `${req.protocol}://${req.headers.host}/auth/refreshEmail/${refreshToken}`;
  const password =
    customAlphabet("ASDFGHJKLQWERTYUIOPZXCVBNM", 1)() +
    customAlphabet("qwertyuioplkjhgfdsambnvcxz", 3)() +
    customAlphabet("!@#$%^&*", 1)() +
    customAlphabet("123456789", 4)();
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
  <h1 style="padding-top:25px; color:#630E2B">Email Confirmation</h1>
  </td>
  </tr>
  <tr>
  <td>
  <p style="padding:0px 100px;">
  </p>
  </td>
  </tr>
    <tr>
  <td>
  <h1 style="padding-top:25px; color:#630E2B">  Your password is : ${password}</h1>
  </td>
  </tr>
  <tr>
  <td>
  <a href="${link}" style="margin:10px 0px 30px 0px;border-radius:4px;padding:10px 20px;border: 0;color:#fff;background-color:#630E2B; ">Verify Email address</a>
  </td>
  </tr>
  <tr>
  <td>
  <br>
  <br>
  <br>
  <br>
  <br>
  <br>
  <br>
  <br>
  <a href="${rfLink}" style="margin:10px 0px 30px 0px;border-radius:4px;padding:10px 20px;border: 0;color:#fff;background-color:#630E2B; ">Request new  email </a>
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
  const info = await sendEmail({
    to: email,
    subject: "Confirmation-Email",
    message,
  });
  if (!info) {
    return next(new Error("Email rejected", { cause: 400 }));
  }
  const hashPassword = hash({ plaintext: password });
  const encryptedPhone = encrypt({ phone });
  const superAdmin = await create({
    model: userModel,
    data: {
      userName,
      email,
      password: hashPassword,
      phone: encryptedPhone,
      gender,
      address,
      DOB,
      role: "SuperAdmin",
      createdBy: user._id,
    },
  });
  return res.status(201).json({ message: "Done", userId: superAdmin._id });
});
export const confirmEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const decoded = verifyToken({ token, signature: process.env.EMAILTOKEN });
  if (!decoded?.email) {
    return next(new Error("In-valid token payload", { cause: 400 }));
  }
  const user = await findOneAndUpdate({
    model: userModel,
    condition: { email: decoded.email, confirmEmail: false },
    data: { confirmEmail: true },
  });
  if (!user) {
    return next(new Error("Already your account is confirmed", { cause: 400 }));
  }
  return res.status(200).json({ message: "Done" });
});
export const refreshEmail = asyncHandler(async (req, res, next) => {
  const { token } = req.params;
  const decoded = verifyToken({ token, signature: process.env.EMAILTOKEN });
  if (!decoded?.email) {
    return next(new Error("Invalid token payload", { cause: 400 }));
  }
  const user = await findOne({
    model: userModel,
    condition: { email: decoded.email },
  });
  if (user.confirmEmail) {
    return next(new Error("Already confirmed", { cause: 400 }));
  }
  const newToken = generateToken({
    payload: { email: decoded.email },
    signature: process.env.EMAILTOKEN,
    expiresIn: 60 * 2,
  });

  const link = `${req.protocol}://${req.headers.host}/auth/confirmEmail/${newToken}`;
  const rfLink = `${req.protocol}://${req.headers.host}/auth/refreshEmail/${token}`;
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
    <h1 style="padding-top:25px; color:#630E2B">Email Confirmation</h1>
    </td>
    </tr>
    <tr>
    <td>
    <p style="padding:0px 100px;">
    </p>
    </td>
    </tr>
    <tr>
    <td>
    <a href="${link}" style="margin:10px 0px 30px 0px;border-radius:4px;padding:10px 20px;border: 0;color:#fff;background-color:#630E2B; ">Verify Email address</a>
    </td>
    </tr>
    <tr>
    <td>
    <br>
    <br>
    <br>
    <br>
    <br>
    <br>
    <br>
    <br>
    <a href="${rfLink}" style="margin:10px 0px 30px 0px;border-radius:4px;padding:10px 20px;border: 0;color:#fff;background-color:#630E2B; ">Request new  email </a>
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
    <tr>
    <td>
    <div style="margin-top:20px;">

    <a href="${process.env.facebookLink}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;color:#fff;border-radius:50%;">
    <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35062_erj5dx.png" width="50px" hight="50px"></span></a>
    
    <a href="${process.env.instegram}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;color:#fff;border-radius:50%;">
    <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group35063_zottpo.png" width="50px" hight="50px"></span>
    </a>
    
    <a href="${process.env.twitterLink}" style="text-decoration: none;"><span class="twit" style="padding:10px 9px;;color:#fff;border-radius:50%;">
    <img src="https://res.cloudinary.com/ddajommsw/image/upload/v1670703402/Group_35064_i8qtfd.png" width="50px" hight="50px"></span>
    </a>

    </div>
    </td>
    </tr>
    </table>
    </td>
    </tr>
    </table>
    </body>
    </html>`;
  const info = await sendEmail({
    to: decoded.email,
    subject: "Confirmation-Email",
    message,
  });
  if (!info) {
    return next(new Error("Email rejected", { cause: 400 }));
  }
  return res.status(200).json({ message: "Go to confirm your email" });
});
export const signin = asyncHandler(async (req, res, next) => {
  const { password } = req.body;
  const email = req.body.email.toLowerCase();
  const user = await findOne({ model: userModel, condition: { email } });
  if (!user) {
    return next(new Error("In-valid this email", { cause: 404 }));
  }
  if (!user.confirmEmail) {
    return next(new Error("Confirm your email first", { cause: 400 }));
  }
  if (user.role == "Admin") {
    if (!user.acceptedMail) {
      return next(new Error("Your Email is not accepted", { cause: 400 }));
    }
  }
  if (user.status == "blocked") {
    return next(new Error("your account is blocked", { cause: 400 }));
  }
  const match = compare({ plaintext: password, hashValue: user.password });
  if (!match) {
    return next(new Error("Password is wrong", { cause: 400 }));
  }
  const token = generateToken({
    payload: { id: user._id },
    expiresIn: 60 * 60 * 24,
  });
  const refresh_token = generateToken({
    payload: { id: user._id },
    expiresIn: 60 * 60 * 24 * 365,
  });
  user.status = "online";
  await user.save();
  return res.status(200).json({ message: "Done", token, refresh_token });
});
export const sendCode = asyncHandler(async (req, res, next) => {
  const email = req.body.email.toLowerCase();
  const user = await findOne({
    model: userModel,
    condition: { email },
    select: "email",
  });
  if (!user) {
    return next(new Error("In-valid user", { cause: 404 }));
  }
  // const code = Math.floor(Math.random() * (9999 - 1000 + 1) + 1000);
  const nanoid = customAlphabet("123456789", 4);
  const code = nanoid();
  user.code = code;
  await user.save();
  const message = `
  <h1>The code is :   ${code}</h2>
  `;
  await sendEmail({ to: user.email, subject: "Forget password", message });
  return res.status(200).json({ message: "Done" });
});
export const forgetPassword = asyncHandler(async (req, res, next) => {
  const { code, password } = req.body;
  const email = req.body.email.toLowerCase();
  const user = await findOne({
    model: userModel,
    condition: { email },
    select: "email code",
  });
  if (!user) {
    return next(new Error("In-valid user", { cause: 404 }));
  }
  if (!user.code) {
    return next(new Error("You didn't send a code", { cause: 400 }));
  }
  if (user.code != code) {
    return next(new Error("this code is wrong", { cause: 400 }));
  }
  const hashPassword = hash({ plaintext: password });
  user.code = null;
  user.password = hashPassword;
  user.status = "online";
  user.changeTime = Date.now();
  await user.save();
  const token = generateToken({
    payload: { id: user._id },
    expiresIn: 60 * 60 * 24,
  });
  const refresh_token = generateToken({
    payload: { id: user._id },
    expiresIn: 60 * 60 * 24 * 365,
  });
  return res.status(200).json({ message: "Done", token, refresh_token });
});
