// Prints the query plan of every query/aggregation the API runs, so the index
// strategy can be verified: `npm run explain` (needs a populated database).
/* eslint-disable no-console */
import mongoose from "mongoose";
import configs from "./app/config/configs";
import { Note } from "./app/modules/notes/note.model";
import { Post } from "./app/modules/posts/post.model";
import { buildUserPostsPipeline } from "./app/modules/posts/post.service";
import { User } from "./app/modules/users/user.model";
import { buildInterestGroupPipeline } from "./app/modules/users/user.service";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

// collects stage / index names and the execution counters from an explain doc
const summarize = (explain: Json) => {
  const stages = new Set<string>();
  const indexes = new Set<string>();
  const stats: Json = {};
  const walk = (node: Json) => {
    if (!node || typeof node !== "object") return;
    if (typeof node.stage === "string") stages.add(node.stage);
    if (typeof node.indexName === "string") indexes.add(node.indexName);
    for (const k of ["nReturned", "totalKeysExamined", "totalDocsExamined"]) {
      if (typeof node[k] === "number" && !(k in stats)) stats[k] = node[k];
    }
    Object.values(node).forEach(walk);
  };
  walk(explain);
  return {
    stages: [...stages].join(" > "),
    indexes: [...indexes].join(", ") || "(none)",
    ...stats,
  };
};

const show = (label: string, explain: Json) =>
  console.log(`\n${label}\n  `, summarize(explain));

async function main() {
  await mongoose.connect(configs.mongodb_url);
  const user = await User.findOne().select("_id email").lean();
  const note = await Note.findOne().select("_id owner").lean();
  const post = await Post.findOne().select("_id author").lean();
  if (!user) throw new Error("Database is empty, create some data first");
  const uid = String(user._id);

  show("login: User.findOne({ email })", await User.find({ email: user.email }).limit(1).explain("executionStats"));
  show("profile: User.findById", await User.find({ _id: user._id }).explain("executionStats"));
  show("admin list users (sort _id)", await User.find({}).sort({ _id: -1 }).limit(11).explain("executionStats"));
  if (note) {
    show("my notes list", await Note.find({ owner: note.owner }).sort({ _id: -1 }).limit(11).explain("executionStats"));
    show("my notes list, page 2 (cursor)", await Note.find({ owner: note.owner, _id: { $lt: note._id } }).sort({ _id: -1 }).limit(11).explain("executionStats"));
    show("admin list all notes", await Note.find({}).sort({ _id: -1 }).limit(11).explain("executionStats"));
    show("single note by id (+owner)", await Note.find({ _id: note._id, owner: note.owner }).explain("executionStats"));
    show("cascade: delete notes of user", await Note.find({ owner: note.owner }).explain("executionStats"));
  }
  show("public posts feed", await Post.find({}).sort({ _id: -1 }).limit(11).explain("executionStats"));
  if (post) show("posts of one author (the $lookup sub-query)", await Post.find({ author: post.author }).sort({ _id: -1 }).limit(11).explain("executionStats"));
  show("Scenario 1: group by interest, filtered (?interest=chess)", await User.aggregate(buildInterestGroupPipeline({ limit: 10, interest: "chess" })).explain("executionStats"));
  show("Scenario 1: group by interest, all users (collection scan is inherent)", await User.aggregate(buildInterestGroupPipeline({ limit: 10 })).explain("executionStats"));
  show("Scenario 2: user posts with $lookup", await User.aggregate(buildUserPostsPipeline(uid, { limit: 10 })).explain("executionStats"));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
