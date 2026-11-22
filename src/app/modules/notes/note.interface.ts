import { Types } from "mongoose";

export type TNote = {
  owner: Types.ObjectId;
  title: string;
  content: string;
};
