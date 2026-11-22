# Secure Notes API

Note-taking REST API with JWT authentication, role-based access control (user / admin),
MongoDB + Mongoose, cursor pagination, a deliberately minimal index set and two aggregation
pipelines.

**Stack:** Node, Express 4, TypeScript, Mongoose 8, JWT, bcrypt, zod, helmet, express-rate-limit.
Requires MongoDB **5.0+**.

## Run

```bash
cp .env.example .env        # set DATABASE_URL and JWT_SECRET
npm install
npm run seed:admin          # creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev                 # http://localhost:6001  (API under /api/v1)
npm run build && npm start  # production
npm run explain             # prints the query plan of every query (needs some data)
```

Self-registration always creates a `user`; admins are created by the seed script or by another admin.

## Roles

| Action | User | Admin |
|---|---|---|
| Create / read / update / delete **own** notes | yes | yes |
| Read **anyone's** notes (`GET /notes`, `?owner=`) | own only | yes (read-only for others' notes) |
| Users: list / get / create / update / delete | no | yes |
| Users grouped by interest | no | yes |
| Posts: read (public), create / update / delete **own** | yes (reads need no token) | yes |

Other people's notes return **404** (not 403) so ids cannot be probed. An admin cannot delete themselves or
remove their own admin role, which guarantees an admin always exists without needing a `role` index.

## API (`/api/v1`)

| Method & path | Access | Notes |
|---|---|---|
| `POST /auth/register`, `POST /auth/login` | public | rate limited |
| `PATCH /auth/change-password` | any signed-in | invalidates old tokens, returns a new one |
| `GET/PATCH /users/me` | any signed-in | PATCH: `name`, `interests` only |
| `GET /users`, `POST /users` | admin | list is paginated |
| `GET/PATCH/DELETE /users/:userId` | admin | delete cascades to the user's notes and posts |
| `GET /users/interests?interest=&limit=&cursor=` | admin | **Scenario 1** |
| `GET/POST /notes`, `GET/PATCH/DELETE /notes/:noteId` | signed-in | list: users see own, admins see all |
| `GET /posts`, `GET /posts/:postId` | public | feed is paginated |
| `GET /posts/user/:userId?limit=&cursor=` | public | **Scenario 2** (`$lookup`) |
| `POST /posts`, `PATCH/DELETE /posts/:postId` | signed-in | author only |

Every list takes `?limit=` (1-50, default 10) and `?cursor=` and returns
`meta: { limit, hasMore, nextCursor }`.

## Pagination

Keyset pagination on `_id` (ObjectIds are creation ordered, so `_id` desc = newest first):
`find({ ..., _id: { $lt: cursor } }).sort({ _id: -1 }).limit(limit + 1)`. The extra row only tells us whether a
next page exists. It never uses `skip()`, so page 500 costs the same as page 1, and no `createdAt` index is needed.

## Indexing strategy (4 custom indexes, all declared with `schema.index`)

```js
UserSchema.index({ email: 1 }, { unique: true });   // login + uniqueness
UserSchema.index({ interests: 1 });                 // multikey, interest-filtered grouping
NoteSchema.index({ owner: 1, _id: -1 });
PostSchema.index({ author: 1, _id: -1 });
```

| Query | Index |
|---|---|
| Login (`findOne({ email })`) | `users {email:1}` |
| Get profile / user by id, auth middleware lookup | default `_id` |
| Admin: list users | default `_id` (sorted by `_id`) |
| User: list own notes (+ cursor) | `notes {owner:1, _id:-1}` equality + sort in one scan |
| Admin: list all notes | default `_id` |
| Admin: notes of one user (`?owner=`) | `notes {owner:1, _id:-1}` |
| Get / update / delete a note by id (+ owner check) | default `_id` |
| Cascade delete of a user's notes / posts | prefixes of the compound indexes |
| Public posts feed, get post by id | default `_id` |
| Update / delete own post | default `_id` |
| Scenario 1 with `?interest=` | `users {interests:1}` (first `$match`) |
| Scenario 2: `$lookup` sub-query on `posts.author` | `posts {author:1, _id:-1}` |
| Scenario 2: `$match` on user `_id` | default `_id` |

**Indexes deliberately not created**

- `role`: low cardinality and no query filters on it (the admin user list is unfiltered).
- `createdAt` on any collection: every list sorts by `_id` instead.
- Separate `owner` / `author` indexes: the compound indexes already cover them as a prefix.
- `{owner, createdAt}` or text indexes: no search or date filter exists in the requirements.
- Duplicate `unique: true` + `schema.index` on the same field: only the `schema.index` form is used.

## Aggregations

**Scenario 1: users grouped by interest** (`user.service.ts`, `buildInterestGroupPipeline`)
Exactly one `User.aggregate()` call: `[$match (if filtered)] → $unwind → [$match] → $group (count + $push users)
→ [$match cursor] → $sort → $limit → $project (with $slice)`.

- With `?interest=chess` the first `$match` uses the multikey `interests` index.
- Grouping **all** users has to read every user: `$unwind` + `$group` cannot use an index, so a collection scan is
  inherent there. The multikey index exists for the filtered view only.
- Groups are paginated by keyset on the interest name; each group returns at most 50 users (`count` is the real total).
- Interests are trimmed, lower-cased and de-duplicated on write so `Chess` / `chess ` do not fragment groups.

**Scenario 2: posts of a user** (`post.service.ts`, `buildUserPostsPipeline`)
One `User.aggregate()`: `$match {_id}` → `$lookup` (`let` + `pipeline`: `$match {$expr: {$eq: [author, $$uid]}, _id < cursor}`
→ `$sort {_id:-1}` → `$limit`) → `$project`. The equality on `author` and the `_id` cursor are served by
`posts {author:1, _id:-1}`, and the page is cut inside the sub-pipeline, so a user with thousands of posts never
loads them all.

## Security

- Passwords hashed with bcrypt (cost 12, `select: false`, never returned); max length 72 (bcrypt limit).
- JWT (HS256 pinned on sign and verify) with `sub` and a `tv` (token version). Changing a password bumps the version,
  which invalidates all older tokens. The role is re-read from the database on every request, so demotion or deletion
  takes effect immediately.
- Login does a dummy bcrypt compare for unknown emails (no account enumeration by timing), generic error message.
- zod validation on body, params and query with `.strict()` (no mass assignment, e.g. `role` on register is rejected).
- helmet, request body limit, rate limit on login/register, page `limit` capped at 50.
- Central error handler: no stack traces in production, duplicate key → 409, bad ids → 400.

## Project layout

```
src/
  app.ts  server.ts  seedAdmin.ts  explain.ts
  app/
    config/configs.ts
    routers/index.ts
    middlware/        auth, validationRequest, globalErrorHandler
    utilitys/         AppError, async.catch, createToken, pagination, sendResponse
    interface/
    modules/{auth,users,notes,posts}/   route · controller · service · model · validation · interface
```
