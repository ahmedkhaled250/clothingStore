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
    quantity: Number,
    finalPrice: Number
  },
  {
    timestamps: true,
  }
);

const productCartModel = model("productCart", productCartSchema);
export default productCartModel;
