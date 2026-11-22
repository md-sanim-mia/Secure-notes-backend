import { model, Schema } from "mongoose";
import { TNote } from "./note.interface";

const noteSchema = new Schema<TNote>(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    content: { type: String, default: "", maxlength: 20000 },
  },
  { timestamps: true }
);

// Serves, via a single index:
//  - "my notes, newest first, paginated"   find({ owner }).sort({ _id: -1 })
//  - admin "notes of one user"             same query with ?owner=
//  - cascade delete when a user is removed deleteMany({ owner })   (prefix)
//  - update/delete of my own note          matched by _id (+ owner filter)
// "Admin: all notes" has no filter, so it is served by the default _id index.
noteSchema.index({ owner: 1, _id: -1 });

export const Note = model<TNote>("Note", noteSchema);
