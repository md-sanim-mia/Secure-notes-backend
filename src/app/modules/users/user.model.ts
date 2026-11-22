import bcrypt from "bcrypt";
import { model, Schema } from "mongoose";
import configs from "../../config/configs";
import { TUser } from "./user.interface";
import { USER_ROLES } from "./users.consten";

// trim + lowercase + de-duplicate so "Chess", " chess" and "chess" become one group
const normalizeInterests = (values: string[]) =>
  Array.from(
    new Set(
      (values || []).map((v) => String(v).trim().toLowerCase()).filter(Boolean)
    )
  );

const userSchema = new Schema<TUser>(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: "user" },
    interests: { type: [String], default: [], set: normalizeInterests },
    tokenVersion: { type: Number, default: 0, select: false },
  },
  { timestamps: true }
);

// Login (find by email) + enforces email uniqueness.
userSchema.index({ email: 1 }, { unique: true });

// Multikey index: serves the interest-filtered grouped view
// (`$match: { interests: "chess" }` is the first stage of the pipeline).
userSchema.index({ interests: 1 });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, configs.bcrypt_rounds);
  next();
});

export const User = model<TUser>("User", userSchema);
