// Creates the first admin (self-registration can only create normal users).
// usage: set ADMIN_EMAIL / ADMIN_PASSWORD in .env, then `npm run seed:admin`
import mongoose from "mongoose";
import configs from "./app/config/configs";
import { User } from "./app/modules/users/user.model";

async function seed() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set");
  }
  await mongoose.connect(configs.mongodb_url);
  const exists = await User.exists({ email: email.toLowerCase() });
  if (exists) {
    console.log("Admin already exists, nothing to do"); // eslint-disable-line no-console
  } else {
    await User.create({
      name: process.env.ADMIN_NAME || "Admin",
      email,
      password,
      role: "admin",
    });
    console.log(`Admin created: ${email}`); // eslint-disable-line no-console
  }
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err); // eslint-disable-line no-console
  process.exit(1);
});
