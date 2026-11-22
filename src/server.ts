import mongoose from "mongoose";
import app from "./app";
import configs from "./app/config/configs";

async function main() {
  try {
    // autoIndex builds the schema.index() definitions on startup
    await mongoose.connect(configs.mongodb_url);
    app.listen(configs.port, () => {
      console.log(`Secure Notes API listening on port ${configs.port}`); // eslint-disable-line no-console
    });
  } catch (error) {
    console.error(error); // eslint-disable-line no-console
    process.exit(1);
  }
}

main();
