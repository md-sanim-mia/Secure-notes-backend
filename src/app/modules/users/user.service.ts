import { PipelineStage, Types } from "mongoose";
import { AppError } from "../../utilitys/AppError";
import { buildPage, TPageQuery } from "../../utilitys/pagination";
import { Note } from "../notes/note.model";
import { Post } from "../posts/post.model";
import { TUser } from "./user.interface";
import { User } from "./user.model";
import { MAX_USERS_PER_INTEREST_GROUP } from "./users.consten";

const createUserForDb = async (payload: Partial<TUser>) => {
  const user = await User.create(payload); // password hashed in pre-save hook
  const safe: Partial<TUser> = user.toObject();
  delete safe.password; // never return the hash
  delete safe.tokenVersion;
  return safe;
};

// Admin list: sorted by _id -> served by the default _id index.
const getAllUserForDb = async ({ limit, cursor }: TPageQuery) => {
  const rows = await User.find(cursor ? { _id: { $lt: cursor } } : {})
    .sort({ _id: -1 })
    .limit(limit + 1)
    .lean();
  return buildPage(rows, limit, (u) => String(u._id));
};

// Profile read: default _id index.
const getSingleUserForDb = async (userId: string) => {
  const user = await User.findById(userId).lean();
  if (!user) throw new AppError(404, "User not found");
  return user;
};

const updateUserForDb = async (
  userId: string,
  actorId: string,
  payload: Partial<TUser>
) => {
  if (userId === actorId && payload.role && payload.role !== "admin") {
    // Guarantees at least one admin always exists without needing a
    // (role) index or a count query.
    throw new AppError(400, "Admins cannot remove their own admin role");
  }
  const user = await User.findById(userId).select("+tokenVersion");
  if (!user) throw new AppError(404, "User not found");

  Object.assign(user, payload);
  if (payload.password) user.tokenVersion += 1; // log the user out everywhere
  await user.save(); // runs validators + hashing hook
  const safe: Partial<TUser> = user.toObject();
  delete safe.password; // never return the hash
  delete safe.tokenVersion;
  return safe;
};

const updateMeForDb = async (userId: string, payload: Partial<TUser>) => {
  const user = await User.findById(userId);
  if (!user) throw new AppError(404, "User not found");
  Object.assign(user, payload); // only name / interests (validated upstream)
  await user.save();
  return user.toObject();
};

const deleteUserForDb = async (userId: string, actorId: string) => {
  if (userId === actorId) {
    throw new AppError(400, "Admins cannot delete their own account");
  }
  const user = await User.findById(userId).select("_id").lean();
  if (!user) throw new AppError(404, "User not found");

  // Dependents first, so a failure half way leaves a retry-able state.
  // Both deletes are served by the compound-index prefixes (owner / author).
  await Note.deleteMany({ owner: user._id });
  await Post.deleteMany({ author: user._id });
  await User.deleteOne({ _id: user._id });
  return { _id: user._id };
};

type TInterestGroupQuery = { limit: number; cursor?: string; interest?: string };

export const buildInterestGroupPipeline = ({
  limit,
  cursor,
  interest,
}: TInterestGroupQuery) => {
  const pipeline: PipelineStage[] = [];
  if (interest) pipeline.push({ $match: { interests: interest } });
  pipeline.push({ $unwind: "$interests" });
  if (interest) pipeline.push({ $match: { interests: interest } });
  pipeline.push(
    {
      $group: {
        _id: "$interests",
        count: { $sum: 1 },
        users: {
          $push: { _id: "$_id", name: "$name", email: "$email" },
        },
      },
    },
    ...(cursor ? [{ $match: { _id: { $gt: cursor } } }] : []),
    { $sort: { _id: 1 } },
    { $limit: limit + 1 },
    {
      $project: {
        _id: 0,
        interest: "$_id",
        count: 1,
        users: { $slice: ["$users", MAX_USERS_PER_INTEREST_GROUP] },
      },
    }
  );
  return pipeline;
};

/**
 * Scenario 1: users grouped by interest, exactly ONE User.aggregate() call.
 *
 * - With `?interest=chess` the first $match uses the multikey `interests`
 *   index (IXSCAN). The second $match (after $unwind) keeps only that group.
 * - Without a filter every user must be read: $unwind + $group cannot use an
 *   index, so a collection scan is inherent to "group everyone".
 * - Groups are paginated by keyset on the interest name (the $group key).
 */
const getUsersGroupedByInterestForDb = async (query: TInterestGroupQuery) => {
  const { limit } = query;
  const rows = await User.aggregate<{
    interest: string;
    count: number;
    users: { _id: Types.ObjectId; name: string; email: string }[];
  }>(buildInterestGroupPipeline(query));
  return buildPage(rows, limit, (g) => g.interest);
};

export const userServices = {
  createUserForDb,
  getAllUserForDb,
  getSingleUserForDb,
  updateUserForDb,
  updateMeForDb,
  deleteUserForDb,
  getUsersGroupedByInterestForDb,
};
