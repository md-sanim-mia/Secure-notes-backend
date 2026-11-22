import { TRole } from "./users.consten";

export type TUser = {
  name: string;
  email: string;
  password: string;
  role: TRole;
  interests: string[];
  // bumped on every password change; tokens carry it, so old tokens die
  tokenVersion: number;
};
