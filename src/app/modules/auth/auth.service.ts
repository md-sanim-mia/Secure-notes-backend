import bcrypt from "bcrypt";
import configs from "../../config/configs";
import { AppError } from "../../utilitys/AppError";
import { createToken } from "../../utilitys/createToken";
import { User } from "../users/user.model";
import { TChangePassword, TLogin, TRegister } from "./auth.interface";

// compared against when the email is unknown so response time does not reveal
// whether an account exists
let dummyHash: string | undefined;
const getDummyHash = async () =>
  (dummyHash ??= await bcrypt.hash("dummy-password", configs.bcrypt_rounds));

const registerForDb = async (payload: TRegister) => {
  const user = await User.create({ ...payload, role: "user" });
  return {
    accessToken: createToken(String(user._id), user.role, user.tokenVersion),
    user: { _id: user._id, name: user.name, email: user.email, role: user.role },
  };
};

const loginForDb = async ({ email, password }: TLogin) => {
  // email is covered by the unique index
  const user = await User.findOne({ email }).select("+password +tokenVersion");
  const hash = user ? user.password : await getDummyHash();
  const matched = await bcrypt.compare(password, hash);
  if (!user || !matched) {
    throw new AppError(401, "Invalid email or password");
  }
  return {
    accessToken: createToken(String(user._id), user.role, user.tokenVersion),
    user: { _id: user._id, name: user.name, email: user.email, role: user.role },
  };
};

const changePasswordForDb = async (
  userId: string,
  { oldPassword, newPassword }: TChangePassword
) => {
  const user = await User.findById(userId).select("+password +tokenVersion");
  if (!user) throw new AppError(404, "User not found");

  if (!(await bcrypt.compare(oldPassword, user.password))) {
    throw new AppError(400, "The old password is incorrect");
  }
  user.password = newPassword;
  // invalidates every token issued before this change (see auth middleware)
  user.tokenVersion += 1;
  await user.save();
  return {
    accessToken: createToken(String(user._id), user.role, user.tokenVersion),
  };
};

export const authService = { registerForDb, loginForDb, changePasswordForDb };
