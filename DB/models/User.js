import { Schema, Types, model } from "mongoose";

const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: [true, "userName is required"],
      min: [2, "minimum length 2 char"],
      max: [20, "max length 2 char"],
      lowercase: true,
    },
    email: {
      type: String,
      unique: [true, "email must be unique value"],
      lowercase: true,
    },
    password: String,
    phone: {
      type: String,
      min: [11, "minimum length 11 char"],
      max: [11, "maximum length 11 char"],
    },
    address: {
      type: String,
      min: [5, "minimum length 5 char"],
      max: [50, "maximum length 50 char"],
    },
    role: {
      type: String,
      default: "User",
      enum: ["User", "Admin", "SuperAdmin"],
    },
    accountType: {
      type: String,
      default: "normal",
    },
    socialId: String,
    gender: String,
    DOB: Date,
    status: {
      type: String,
      default: "offline",
      enum: ["offline", "online", "blocked"],
    },
    confirmEmail: {
      type: Boolean,
      default: false,
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    code: {
      type: Number,
      default: null,
    },
    changeTime: Date,
    accountRequested:[{ type: Types.ObjectId, ref: "User" }],
    accountBlocked: [{ type: Types.ObjectId, ref: "User" }],
    acceptedMail: Boolean,
    createdBy: { type: Types.ObjectId, ref: "User" },
    image: {
      type: { secure_url: String, public_id: String },
    },
    wishList: { type: [Types.ObjectId], ref: "Product" },
  },
  {
    timestamps: true,
  }
);
const userModel = model("User", userSchema);
export default userModel;
