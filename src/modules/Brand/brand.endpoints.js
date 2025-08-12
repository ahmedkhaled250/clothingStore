import { roles } from "../../middleware/auth.js";

const endPoint = {
    createBrand:[roles.Admin],
    brand:[roles.SuperAdmin]
}
export default endPoint