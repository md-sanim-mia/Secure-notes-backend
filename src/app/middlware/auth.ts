import jwt, { JwtPayload } from "jsonwebtoken";
import configs from "../config/configs";
import { User } from "../modules/users/user.model";
import { TRole } from "../modules/users/users.consten";
import { AppError } from "../utilitys/AppError";
import { asyncCatch } from "../utilitys/async.catch";

const auth = (...requiredRoles: TRole[]) => {
  return asyncCatch(async (req, res, next) => {
    const header = req.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      throw new AppError(401, "You are not authorized");
    }

    const decoded = jwt.verify(header.slice(7), configs.jwt_secret, {
      algorithms: ["HS256"],
    }) as JwtPayload;

    // Lookup by _id (default index). The role is read from the database, not
    // from the token, so a demoted/deleted user loses access immediately.
    const user = await User.findById(decoded.sub)
      .select("role tokenVersion")
      .lean();
    if (!user) {
      throw new AppError(401, "You are not authorized");
    }

    if (decoded.tv !== (user.tokenVersion ?? 0)) {
      throw new AppError(401, "Password changed, please log in again");
    }

    if (requiredRoles.length && !requiredRoles.includes(user.role)) {
      throw new AppError(403, "You do not have permission for this action");
    }

    req.user = { id: String(user._id), role: user.role };
    next();
  });
};

export default auth;
