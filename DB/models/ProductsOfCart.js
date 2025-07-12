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
    colorCode: {
      type: String,
      required:[true,"Color code is required"]
    },
    size: {
      type: String,
      enum: ["ss", "s", "m", "l", "xl", "xxl", "xxxl", ""],
      required:[true,"Color code is required"]
    },
    quantity: Number,
    finalPrice: Number
  },
  {
    timestamps: true,
  }
);

const productCartModel = model("productCart", productCartSchema);
export default productCartModel;
