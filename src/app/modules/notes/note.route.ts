import express from "express";
import auth from "../../middlware/auth";
import { validationRequest } from "../../middlware/validationRequest";
import { noteContllor } from "./noteContllor";
import { noteValidation } from "./noteValidation";

const router = express.Router();

router.use(auth("user", "admin"));

router.post(
  "/",
  validationRequest(noteValidation.createNoteSchema),
  noteContllor.createNote
);
router.get(
  "/",
  validationRequest(noteValidation.listNotesSchema),
  noteContllor.getNotes
);
router.get(
  "/:noteId",
  validationRequest(noteValidation.noteIdParamSchema),
  noteContllor.getSingleNote
);
router.patch(
  "/:noteId",
  validationRequest(noteValidation.updateNoteSchema),
  noteContllor.updateNote
);
router.delete(
  "/:noteId",
  validationRequest(noteValidation.noteIdParamSchema),
  noteContllor.deleteNote
);

export const noteRoute = router;
