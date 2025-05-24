import { roles } from "../../middleware/auth.js";

const endPoint = {
  cart: [roles.User],
};
export default endPoint;
