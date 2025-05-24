import { Router } from "express";
import { auth } from "../../middleware/auth.js";
import * as wishListController from './controller/wishList.js'
import  endPoint  from "./wishList.endPoint.js";
import wishList from "./wishList.validation.js";
import validation from "../../middleware/validation.js";
const router = Router({mergeParams:true})
router.patch('/add',validation(wishList),auth(endPoint.add),wishListController.add)
router.patch('/remove',validation(wishList),auth(endPoint.remove),wishListController.remove)
export default router