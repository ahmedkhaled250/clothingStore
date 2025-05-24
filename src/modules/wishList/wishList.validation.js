import joi from "joi";
import { generalFields } from "../../middleware/validation.js";
const wishList = joi
  .object({
    productId: generalFields.id,
    authorization: generalFields.headers,
  })
  .required();
export default wishList;