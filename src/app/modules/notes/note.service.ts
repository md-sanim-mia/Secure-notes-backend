import { FilterQuery } from "mongoose";
import { AppError } from "../../utilitys/AppError";
import { buildPage, TPageQuery } from "../../utilitys/pagination";
import { TNote } from "./note.interface";
import { Note } from "./note.model";

type TActor = { id: string; role: "user" | "admin" };

const createNoteForDb = async (ownerId: string, payload: Partial<TNote>) => {
  return Note.create({ ...payload, owner: ownerId });
};

// users: only their own notes. admins: everyone's (optionally ?owner=<userId>).
const getNotesForDb = async (
  actor: TActor,
  { limit, cursor, owner }: TPageQuery & { owner?: string }
) => {
  const filter: FilterQuery<TNote> = {};
  if (actor.role === "admin") {
    if (owner) filter.owner = owner;
  } else {
    filter.owner = actor.id;
  }
  if (cursor) filter._id = { $lt: cursor };

  const query = Note.find(filter)
    .sort({ _id: -1 })
    .limit(limit + 1);
  // admins also see whose note it is (extra lookup by _id)
  if (actor.role === "admin") query.populate("owner", "name email");

  const rows = await query.lean();
  return buildPage(rows, limit, (n) => String(n._id));
};

// Admins may read any note; users only their own. Not-owned => 404, so ids
// of other people's notes cannot be probed.
const getSingleNoteForDb = async (actor: TActor, noteId: string) => {
  const filter: FilterQuery<TNote> = { _id: noteId };
  if (actor.role !== "admin") filter.owner = actor.id;
  const note = await Note.findOne(filter).lean();
  if (!note) throw new AppError(404, "Note not found");
  return note;
};

// Writes are owner-only for everyone, admins included.
const updateNoteForDb = async (
  ownerId: string,
  noteId: string,
  payload: Partial<TNote>
) => {
  const note = await Note.findOneAndUpdate(
    { _id: noteId, owner: ownerId },
    payload,
    { new: true, runValidators: true }
  ).lean();
  if (!note) throw new AppError(404, "Note not found");
  return note;
};

const deleteNoteForDb = async (ownerId: string, noteId: string) => {
  const note = await Note.findOneAndDelete({
    _id: noteId,
    owner: ownerId,
  }).lean();
  if (!note) throw new AppError(404, "Note not found");
  return { _id: note._id };
};

export const noteServices = {
  createNoteForDb,
  getNotesForDb,
  getSingleNoteForDb,
  updateNoteForDb,
  deleteNoteForDb,
};
