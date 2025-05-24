import { roles } from "../../middleware/auth.js";

const endPoint = {
  review: [roles.User],
};
export default endPoint;
