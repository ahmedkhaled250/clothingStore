import { Schema, Types, model } from "mongoose";

const brandSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "userName is required"],
      min: [2, "minimum length 2 char"],
      max: [20, "max length 2 char"],
      unique: [true, "name must be unique value"],
      lowercase: true,
    },
    slug: String,
    image: {
      type: { secure_url: String, public_id: String },
      required: [true, "Image is required"],
    },
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: [true, "Oner is required"],
    },
    updatedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
    cloudId: String,
  },
  {
    timestamps: true,
  }
);
const brandModel = model("Brand", brandSchema);
export default brandModel;
