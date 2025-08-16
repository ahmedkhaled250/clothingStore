import { roles } from "../../middleware/auth.js";

const endPoint = {
  product: [roles.Admin],
  recievedProducts: [roles.User],
};
export default endPoint