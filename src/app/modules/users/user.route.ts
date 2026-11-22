import express from "express";
import auth from "../../middlware/auth";
import { validationRequest } from "../../middlware/validationRequest";
import { userContllor } from "./userContllor";
import { userValidation } from "./userValidation";

const router = express.Router();

// every route below needs a valid token; management routes need the admin role
router.get("/me", auth("user", "admin"), userContllor.getMe);
router.patch(
  "/me",
  auth("user", "admin"),
  validationRequest(userValidation.updateMeSchema),
  userContllor.updateMe
);

// NOTE: static paths must stay above "/:userId"
router.get(
  "/interests",
  auth("admin"),
  validationRequest(userValidation.interestGroupsSchema),
  userContllor.getUsersGroupedByInterest
);

router.post(
  "/",
  auth("admin"),
  validationRequest(userValidation.createUserSchema),
  userContllor.createUser
);
router.get(
  "/",
  auth("admin"),
  validationRequest(userValidation.listUsersSchema),
  userContllor.getAllUser
);
router.get(
  "/:userId",
  auth("admin"),
  validationRequest(userValidation.userIdParamSchema),
  userContllor.getSingleUser
);
router.patch(
  "/:userId",
  auth("admin"),
  validationRequest(userValidation.updateUserSchema),
  userContllor.updateSingleUser
);
router.delete(
  "/:userId",
  auth("admin"),
  validationRequest(userValidation.userIdParamSchema),
  userContllor.deleteSingleUser
);

export const userRoute = router;
