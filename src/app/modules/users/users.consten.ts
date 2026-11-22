export const USER_ROLES = ["user", "admin"] as const;
export type TRole = (typeof USER_ROLES)[number];

// Max users returned per interest group in the grouped view (the `count`
// field still reports the real total).
export const MAX_USERS_PER_INTEREST_GROUP = 50;
