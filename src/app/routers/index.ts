import express from "express";
import { authRouters } from "../modules/auth/auth.route";
import { noteRoute } from "../modules/notes/note.route";
import { postRoute } from "../modules/posts/post.route";
import { userRoute } from "../modules/users/user.route";

const router = express.Router();

const modulsRouter = [
  { path: "/auth", route: authRouters },
  { path: "/users", route: userRoute },
  { path: "/notes", route: noteRoute },
  { path: "/posts", route: postRoute },
];

modulsRouter.forEach((item) => router.use(item.path, item.route));

export default router;
