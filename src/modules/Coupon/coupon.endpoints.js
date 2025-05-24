import { roles } from "../../middleware/auth.js";

const endPoint = {
  coupon: [roles.Admin],
};
export default endPoint;
