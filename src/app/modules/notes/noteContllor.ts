import { asyncCatch } from "../../utilitys/async.catch";
import { sendResponse } from "../../utilitys/sendResponse";
import { noteServices } from "./note.service";

const createNote = asyncCatch(async (req, res) => {
  const data = await noteServices.createNoteForDb(req.user!.id, req.body);
  sendResponse(res, { statusCode: 201, message: "Note created", data });
});

const getNotes = asyncCatch(async (req, res) => {
  const { data, meta } = await noteServices.getNotesForDb(
    req.user!,
    req.query as never
  );
  sendResponse(res, { message: "Notes retrieved", data, meta });
});

const getSingleNote = asyncCatch(async (req, res) => {
  const data = await noteServices.getSingleNoteForDb(
    req.user!,
    req.params.noteId
  );
  sendResponse(res, { message: "Note retrieved", data });
});

const updateNote = asyncCatch(async (req, res) => {
  const data = await noteServices.updateNoteForDb(
    req.user!.id,
    req.params.noteId,
    req.body
  );
  sendResponse(res, { message: "Note updated", data });
});

const deleteNote = asyncCatch(async (req, res) => {
  const data = await noteServices.deleteNoteForDb(
    req.user!.id,
    req.params.noteId
  );
  sendResponse(res, { message: "Note deleted", data });
});

export const noteContllor = {
  createNote,
  getNotes,
  getSingleNote,
  updateNote,
  deleteNote,
};
