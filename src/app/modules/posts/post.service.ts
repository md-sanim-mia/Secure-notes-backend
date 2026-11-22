import { PipelineStage, Types } from "mongoose";
import { AppError } from "../../utilitys/AppError";
import { buildPage, TPageQuery } from "../../utilitys/pagination";
import { User } from "../users/user.model";
import { TPost } from "./post.interface";
import { Post } from "./post.model";

const createPostForDb = async (authorId: string, payload: Partial<TPost>) => {
  return Post.create({ ...payload, author: authorId });
};

// public feed: sorted by _id -> default _id index
const getAllPostsForDb = async ({ limit, cursor }: TPageQuery) => {
  const rows = await Post.find(cursor ? { _id: { $lt: cursor } } : {})
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();
  return buildPage(rows, limit, (p) => String(p._id));
};

const getSinglePostForDb = async (postId: string) => {
  const post = await Post.findById(postId).lean();
  if (!post) throw new AppError(404, "Post not found");
  return post;
};

const updatePostForDb = async (
  authorId: string,
  postId: string,
  payload: Partial<TPost>
) => {
  const post = await Post.findOneAndUpdate(
    { _id: postId, author: authorId },
    payload,
    { new: true, runValidators: true }
  ).lean();
  if (!post) throw new AppError(404, "Post not found");
  return post;
};

const deletePostForDb = async (authorId: string, postId: string) => {
  const post = await Post.findOneAndDelete({
    _id: postId,
    author: authorId,
  }).lean();
  if (!post) throw new AppError(404, "Post not found");
  return { _id: post._id };
};

export const buildUserPostsPipeline = (
  userId: string,
  { limit, cursor }: TPageQuery
) => {
  const pipeline: PipelineStage[] = [
    { $match: { _id: new Types.ObjectId(userId) } },
    {
      $lookup: {
        from: Post.collection.name,
        let: { uid: "$_id" },
        pipeline: [
          {
            $match: {
              $expr: { $eq: ["$author", "$$uid"] },
              ...(cursor && { _id: { $lt: new Types.ObjectId(cursor) } }),
            },
          },
          { $sort: { _id: -1 } },
          { $limit: limit + 1 },
        ],
        as: "posts",
      },
    },
    { $project: { name: 1, interests: 1, posts: 1 } },
  ];
  return pipeline;
};

/**
 * Scenario 2: all posts of one user, ONE aggregation pipeline with $lookup.
 *
 * - $match on _id    -> default _id index (a single user)
 * - $lookup with `let` + `pipeline`: the sub-pipeline $match has an equality
 *   on posts.author ($expr/$eq, indexable) plus the optional `_id` cursor, so
 *   the { author: 1, _id: -1 } index serves the filter; the sub-pipeline then
 *   sorts newest-first and limits to one page (+1 to detect a next page).
 */
const getPostsByUserForDb = async (userId: string, query: TPageQuery) => {
  const { limit } = query;
  const [user] = await User.aggregate<{
    _id: Types.ObjectId;
    name: string;
    interests: string[];
    posts: (TPost & { _id: Types.ObjectId })[];
  }>(buildUserPostsPipeline(userId, query));
  if (!user) throw new AppError(404, "User not found");

  const { data, meta } = buildPage(user.posts, limit, (p) => String(p._id));
  return {
    data: { _id: user._id, name: user.name, interests: user.interests, posts: data },
    meta,
  };
};

export const postServices = {
  createPostForDb,
  getAllPostsForDb,
  getSinglePostForDb,
  updatePostForDb,
  deletePostForDb,
  getPostsByUserForDb,
};
