import { roles } from "../../middleware/auth.js";

const endPoint = {
    add : [roles.User],
    remove : [roles.User]
}
export default endPoint