import { asyncCatch } from "../../utilitys/async.catch";
import { sendResponse } from "../../utilitys/sendResponse";
import { userServices } from "./user.service";

const createUser = asyncCatch(async (req, res) => {
  const data = await userServices.createUserForDb(req.body);
  sendResponse(res, { statusCode: 201, message: "User created", data });
});

const getAllUser = asyncCatch(async (req, res) => {
  const { data, meta } = await userServices.getAllUserForDb(
    req.query as never
  );
  sendResponse(res, { message: "Users retrieved", data, meta });
});

const getMe = asyncCatch(async (req, res) => {
  const data = await userServices.getSingleUserForDb(req.user!.id);
  sendResponse(res, { message: "Profile retrieved", data });
});

const getSingleUser = asyncCatch(async (req, res) => {
  const data = await userServices.getSingleUserForDb(req.params.userId);
  sendResponse(res, { message: "User retrieved", data });
});

const updateMe = asyncCatch(async (req, res) => {
  const data = await userServices.updateMeForDb(req.user!.id, req.body);
  sendResponse(res, { message: "Profile updated", data });
});

const updateSingleUser = asyncCatch(async (req, res) => {
  const data = await userServices.updateUserForDb(
    req.params.userId,
    req.user!.id,
    req.body
  );
  sendResponse(res, { message: "User updated", data });
});

const deleteSingleUser = asyncCatch(async (req, res) => {
  const data = await userServices.deleteUserForDb(
    req.params.userId,
    req.user!.id
  );
  sendResponse(res, { message: "User deleted", data });
});

const getUsersGroupedByInterest = asyncCatch(async (req, res) => {
  const { data, meta } = await userServices.getUsersGroupedByInterestForDb(
    req.query as never
  );
  sendResponse(res, { message: "Users grouped by interest", data, meta });
});

export const userContllor = {
  createUser,
  getAllUser,
  getMe,
  getSingleUser,
  updateMe,
  updateSingleUser,
  deleteSingleUser,
  getUsersGroupedByInterest,
};
