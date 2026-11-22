import { asyncCatch } from "../../utilitys/async.catch";
import { sendResponse } from "../../utilitys/sendResponse";
import { postServices } from "./post.service";

const createPost = asyncCatch(async (req, res) => {
  const data = await postServices.createPostForDb(req.user!.id, req.body);
  sendResponse(res, { statusCode: 201, message: "Post created", data });
});

const getAllPosts = asyncCatch(async (req, res) => {
  const { data, meta } = await postServices.getAllPostsForDb(req.query as never);
  sendResponse(res, { message: "Posts retrieved", data, meta });
});

const getSinglePost = asyncCatch(async (req, res) => {
  const data = await postServices.getSinglePostForDb(req.params.postId);
  sendResponse(res, { message: "Post retrieved", data });
});

const getPostsByUser = asyncCatch(async (req, res) => {
  const { data, meta } = await postServices.getPostsByUserForDb(
    req.params.userId,
    req.query as never
  );
  sendResponse(res, { message: "User posts retrieved", data, meta });
});

const updatePost = asyncCatch(async (req, res) => {
  const data = await postServices.updatePostForDb(
    req.user!.id,
    req.params.postId,
    req.body
  );
  sendResponse(res, { message: "Post updated", data });
});

const deletePost = asyncCatch(async (req, res) => {
  const data = await postServices.deletePostForDb(
    req.user!.id,
    req.params.postId
  );
  sendResponse(res, { message: "Post deleted", data });
});

export const postContllor = {
  createPost,
  getAllPosts,
  getSinglePost,
  getPostsByUser,
  updatePost,
  deletePost,
};
