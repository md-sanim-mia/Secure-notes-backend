import express from "express";
import auth from "../../middlware/auth";
import { validationRequest } from "../../middlware/validationRequest";
import { postContllor } from "./postContllor";
import { postValidation } from "./postValidation";

const router = express.Router();

// posts are public to read, so GET routes need no token
router.get(
  "/",
  validationRequest(postValidation.listPostsSchema),
  postContllor.getAllPosts
);
// NOTE: "/user/:userId" must stay above "/:postId"
router.get(
  "/user/:userId",
  validationRequest(postValidation.userPostsSchema),
  postContllor.getPostsByUser
);
router.get(
  "/:postId",
  validationRequest(postValidation.postIdParamSchema),
  postContllor.getSinglePost
);

router.post(
  "/",
  auth("user", "admin"),
  validationRequest(postValidation.createPostSchema),
  postContllor.createPost
);
router.patch(
  "/:postId",
  auth("user", "admin"),
  validationRequest(postValidation.updatePostSchema),
  postContllor.updatePost
);
router.delete(
  "/:postId",
  auth("user", "admin"),
  validationRequest(postValidation.postIdParamSchema),
  postContllor.deletePost
);

export const postRoute = router;
