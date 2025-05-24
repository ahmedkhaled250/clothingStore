import { Schema, Types, model } from "mongoose";

const couponSchema = new Schema(
  {
    name: {
      type: String,
      unique: [true, "name must be unique value"],
      required: [true, "name is required"],
      min: [2, "minimum length 2 char"],
      max: [20, "max length 20 char"],
      lowercase: true,
      trim: true,
    },
    amount: {
      type: Number,
      default: 1,
      min: [1, "minimum 1%"],
      max: [100, "minimum 100%"],
    },
    deleted: { type: Boolean, default: false },
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: [true, "can not coupon without owner"],
    },
    usedBy: {
      type: [Types.ObjectId],
      ref: "User",
    },
    deletedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
    updatedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
    expireDate: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const couponModel = model("Coupon", couponSchema);
export default couponModel;
