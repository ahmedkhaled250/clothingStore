import { roles } from "../../middleware/auth.js";

const endPoint = {
  allUsers: [roles.SuperAdmin, roles.Admin, roles.User],
  blockUser: [roles.SuperAdmin, roles.Admin],
  SuperAdmin:[roles.SuperAdmin]
};
export default endPoint;
