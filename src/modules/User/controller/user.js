import {
  find,
  findById,
  findOne,
  updateOne,
} from "../../../../DB/DBMethods.js";
import userModel from "../../../../DB/models/User.js";
import { compare, hash } from "../../../utils/HashAndCompare.js";
import cloudinary from "../../../utils/cloudinary.js";
import { asyncHandler } from "../../../utils/errorHandling.js";
export const acceptAdmin = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { user } = req;
  if (user.deleted) {
    return next(new Error("You deleted your profile", { cause: 400 }));
  }
  if (!user.accountRequested.includes(id)) {
    return next(
      new Error("This account is not in your admin requests", { cause: 400 })
    );
  }
  const checkUser = await findById({ model: userModel, condition: id });
  if (!checkUser) {
    return next(new Error("This account is not found", { cause: 404 }));
  }
  await updateOne({
    model: userModel,
    condition: { _id: user._id },
    data: { $pull: { accountRequested: id } },
  });
  checkUser.acceptedMail = true;
  await checkUser.save();
  return res.status(200).json({ message: "Done" });
});
export const refuseAdmin = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const { user } = req;
  if (user.deleted) {
    return next(new Error("You deleted your profile", { cause: 400 }));
  }
  if (!user.accountRequested.includes(id)) {
    return next(
      new Error("This account is not in your admin requests", { cause: 400 })
    );
  }
  const checkUser = await findById({ model: userModel, condition: id });
  if (!checkUser) {
    return next(new Error("This account is not found", { cause: 404 }));
  }
  await updateOne({
    model: userModel,
    condition: { _id: user._id },
    data: { $pull: { accountRequested: id } },
  });
  checkUser.acceptedMail = false;
  await checkUser.save();
  return res.status(200).json({ message: "Done" });
});
export const profilePic = asyncHandler(async (req, res, next) => {
  const { user } = req;
  if (user.deleted) {
    return next(new Error("You deleted your profile", { cause: 400 }));
  }
  const { public_id, secure_url } = await cloudinary.uploader.upload(
    req.file.path,
    {
      folder: `${process.env.PROJECTNAME}/user/profilePic/${user._id}`,
    }
  );
  if (user.image) {
    await cloudinary.uploader.destroy(user.image.public_id);
  }
  user.image = { public_id, secure_url };
  await user.save();
  return res.status(200).json({ message: "Done" });
});
export const deleteProfilePic = asyncHandler(async (req, res, next) => {
  const { user } = req;
  if (user.deleted) {
    return next(new Error("Your account is deleted", { cause: 400 }));
  }
  if (!user.image) {
    return next(new Error("Already you have not profilePic", { cause: 400 }));
  }
  await cloudinary.uploader.destroy(user.image.public_id);
  user.image = null;
  await user.save();
  return res.status(200).json({ message: "Done" });
});
export const updatePassword = asyncHandler(async (req, res, next) => {
  const { _id } = req.user;
  const user = await findById({ model: userModel, condition: _id });
  const { oldPassword, password } = req.body;
  const match = compare({ plaintext: oldPassword, hashValue: user.password });
  if (!match) {
    return next(new Error("this password is wrong", { cause: 400 }));
  }
  const hashPassword = hash({ plaintext: password });
  user.password = hashPassword;
  user.changeTime = Date.now();
  await user.save();
  return res.status(200).json({ message: "Done" });
});
export const softDelete = asyncHandler(async (req, res, next) => {
  const { user } = req;
  if (user.deleted) {
    user.deleted = false;
  } else {
    user.deleted = true;
  }
  await user.save();
  return res.status(200).json({ message: "Done" });
});
export const blockUser = asyncHandler(async (req, res, next) => {
  const { user } = req;
  const { id } = req.params;
  if (user.deleted) {
    return next(new Error("Your account is stopped", { cause: 400 }));
  }
  if (user._id == id) {
    return next(new Error("You can't block your self", { cause: 400 }));
  }
  const userBlocked = await findById({ model: userModel, condition: id });
  if (!userBlocked) {
    return next(new Error("In-valid user", { cause: 404 }));
  }
  if (user.role == "SuperAdmin") {
    if (user.createdBy) {
      if (userBlocked.role == "SuperAdmin") {
        return next(
          new Error("You cannot block any super admin loke you", { cause: 403 })
        );
      }
    }
  } else {
    if (userBlocked.role != "User") {
      return next(
        new Error("You can just block User accounts", { cause: 400 })
      );
    }
  }
  if (userBlocked.status == "blocked") {
    userBlocked.status = "offline";
  } else {
    userBlocked.changeTime = Date.now();
    userBlocked.status = "blocked";
  }
  await userBlocked.save();
  return res.status(200).json({ message: "Done" });
});
export const profile = asyncHandler(async (req, res, next) => {
  const { user } = req;
  return res.status(200).json({ message: "Done", user });
});
export const getUserById = asyncHandler(async (req, res, next) => {
  const { id } = req.params;
  const user = await findOne({
    model: userModel,
    condition: { _id: id, status: { $ne: "blocked" } },
    select: "-password",
  });
  if (!user) {
    return next(new Error("In-valid user", { cause: 404 }));
  }
  return res.status(200).json({ message: "Done", user });
});
export const users = asyncHandler(async (req, res, next) => {
  const users = await find({
    model: userModel,
    select: "-password",
  });
  if (!users.length) {
    return next(new Error("In-valid users", { cause: 404 }));
  }
  return res.status(200).json({ message: "Done", users });
});
