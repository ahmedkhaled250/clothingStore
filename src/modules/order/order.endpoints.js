import { roles } from "../../middleware/auth.js";

const endPoint = {
  order: [roles.User],
};
export default endPoint;
