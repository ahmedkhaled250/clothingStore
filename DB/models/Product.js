import { Schema, Types, model } from "mongoose";

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "userName is required"],
      min: [2, "minimum length 2 char"],
      max: [20, "max length 2 char"],
      lowercase: true,
      trim: true,
    },
    slug: String,
    description: String,
    images: { type: [{ secure_url: String, public_id: String }] },
    // colors: {
    //   type: [{
    //     color: String,
    //     subImages: { type: [{ secure_url: String, public_id: String }] },
    //     stock,
    //     TOTALaMOUNT,
    //     soldItems
    //   }],
    //   required: true
    // },
    colors: [String],
    size: {
      type: [String],
      enum: ["ss", "s", "m", "l", "xl", "xxl", ""],
    },
    stock: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      default: 0
    },
    price: {
      type: Number,
      default: 1,
    },
    discound: {
      type: Number,
      default: 0,
    },
    finalPrice: {
      type: Number,
      default: 1,
    },
    soldItems: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: [true, "Oner is required"],
    },
    wishUserList: [{ type: Types.ObjectId, ref: "User" }],
    categoryId: {
      type: Types.ObjectId,
      ref: "Category",
      required: [true, "CategoryId is required"],
    },
    subcategoryId: {
      type: Types.ObjectId,
      ref: "Subcategory",
      required: [true, "SubcategoryId is required"],
    },
    brandId: {
      type: Types.ObjectId,
      ref: "Brand",
      required: [true, "BrandId is required"],
    },
    deleted: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      min: [1, "minimum rating 1"],
      max: [5, "maximum rating 5"],
    },
    cloudId: String,
  },
  {
    timestamps: true,
    // toJSON: { virtuals: true },
    // toObject: { virtuals: true },
  }
);
// productSchema.virtual("review", {
//   ref: "Review",
//   localField: "_id",
//   foreignField: "productId",
// });
const productModel = model("Product", productSchema);
export default productModel;
