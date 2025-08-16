import { Schema, Types, model } from "mongoose";

const productSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      min: [2, "minimum length 2 char"],
      max: [20, "max length 2 char"],
      lowercase: true,
      trim: true,
    },
    slug: String,
    description: String,
    colors: {
      type: [Types.ObjectId],
      ref: "color"
    },
    allSizes: {
      type: [String],
      enum: ["ss", "s", "m", "l", "xl", "xxl", "xxxl", ""],
    },
    totalStock: {
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
    discount: {
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
    updatedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
    deletedBy: {
      type: Types.ObjectId,
      ref: "User",
    },
    wishUserList: {
      type: [{
        colorCode: String,
        userId: { type: Types.ObjectId, ref: "User" },
      }]
    },
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
    categoryDeleted: {
      type: Boolean,
      default: false,
    },
    subcategoryDeleted: {
      type: Boolean,
      default: false,
    },
    brandDeleted: {
      type: Boolean,
      default: false,
    },
    rating: {
      type: Number,
      min: [0, "minimum rating 0"],
      max: [5, "maximum rating 5"],
      default: 0
    },
    numOfReviews: {
      type: Number,
      default: 0
    },
    cloudId: String,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
productSchema.virtual("review", {
  ref: "Review",
  localField: "_id",
  foreignField: "productId",
});
const productModel = model("Product", productSchema);
export default productModel;
