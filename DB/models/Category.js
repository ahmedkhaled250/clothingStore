import { Schema, Types, model } from "mongoose";

const categorySchema = new Schema(
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
      required: [true, "Owner is required"],
    },
    updatedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
    cloudId: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// categorySchema.virtual("subcategory", {
//   ref: "Subcategory",
//   localField: "_id",
//   foreignField: "categoryId",
// });
const categoryModel = model("Category", categorySchema);
export default categoryModel;
