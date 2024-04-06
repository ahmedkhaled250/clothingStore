import { roles } from "../../middleware/auth.js";

const endPoint = {
  product: [roles.Admin],
};
export default endPoint