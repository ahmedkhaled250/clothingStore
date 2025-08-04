import { roles } from "../../middleware/auth.js";

const endPoint = {
  order: [roles.User],
  updateStatus: [roles.Admin],
};
export default endPoint;
