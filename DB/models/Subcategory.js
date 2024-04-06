import { Schema, Types, model } from "mongoose";

const subcategorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "userName is required"],
      min: [2, "minimum length 2 char"],
      max: [50, "max length 2 char"],
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
    subcategoryId: {
      type: Types.ObjectId,
      ref: "Subcategory",
    },
    cloudId: String,
    categoryId: {
      type: Types.ObjectId,
      ref: "Category",
      required: [true, "categoryId is required"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
subcategorySchema.virtual("products", {
  ref: "Product",
  localField: "_id",
  foreignField: "subcategoryId",
});
const subcategoryModel = model("Subcategory", subcategorySchema);
export default subcategoryModel;
