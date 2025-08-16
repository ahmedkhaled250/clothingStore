import { Schema, Types, model } from "mongoose";

const productCartSchema = new Schema(
  {
    cartId: {
      type: Types.ObjectId,
      ref: "Cart",
    },
    productId: {
      type: Types.ObjectId,
      ref: "Product",
    },
    colorName: {
      type: String,
      required: [true, "Color name is required"],
      min: [2, "minimum length 2 char"],
      max: [20, "max length 2 char"],
      lowercase: true,
      trim: true,
    },
    colorCode: {
      type: String,
      required: [true, "Color code is required"]
    },
    size: {
      type: String,
      enum: ["ss", "s", "m", "l", "xl", "xxl", "xxxl", ""],
      required: [true, "Size is required"]
    },
    quantity: Number,
    totalPrice: Number,
    discount: Number,
    finalPrice: Number
  },
  {
    timestamps: true,
  }
);

const productCartModel = model("productCart", productCartSchema);
export default productCartModel;
