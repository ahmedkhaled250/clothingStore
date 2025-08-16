import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import * as wishListController from './controller/wishList.js'
import endPoint from "./wishList.endPoint.js";
import { wishList, getWishList } from "./wishList.validation.js";
import validation from "../../middleware/validation.js";
const router = Router({ mergeParams: true })
router.post('/', validation(wishList), auth(endPoint.user), wishListController.add)
router.delete('/', validation(wishList), auth(endPoint.user), wishListController.remove)
router.get('/wishlistIds', validation(getWishList), auth(endPoint.user), wishListController.wishlistIds)
router.get('/', validation(getWishList), auth(endPoint.user), wishListController.wishlist)
export default router