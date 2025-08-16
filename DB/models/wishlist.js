import { Schema, Types, model } from "mongoose";

const wishlistSchema = new Schema(
  {
    userId: {
      type: Types.ObjectId,
      ref: "User",
    },
    product: { type: Types.ObjectId, ref: "Product" },
  }
);

const wishlistModel = model("wishlist", wishlistSchema);
export default wishlistModel;
