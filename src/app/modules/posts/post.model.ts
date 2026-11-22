import { model, Schema } from "mongoose";
import { TPost } from "./post.interface";

const postSchema = new Schema<TPost>(
  {
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, default: "", maxlength: 20000 },
  },
  { timestamps: true }
);

// Serves the $lookup of Scenario 2: equality on `author`, then the
// newest-first order / cursor on `_id` inside the sub-pipeline. Also covers
// the cascade delete (prefix) and the author-only update/delete checks.
// The public feed (no filter) uses the default _id index.
postSchema.index({ author: 1, _id: -1 });

export const Post = model<TPost>("Post", postSchema);
