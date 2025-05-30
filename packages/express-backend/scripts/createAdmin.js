import { createUser } from "../models/User.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

let dirName;
try {
  dirName = path.dirname(fileURLToPath(import.meta.url));
} catch {
  dirName = process.cwd();
}

dotenv.config({ path: path.join(dirName, "../.env") });

const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!email || !password) {
  console.error(
    "ADMIN_EMAIL and ADMIN_PASSWORD environment variables required"
  );
  process.exit(1);
}

const result = await createUser(email, password, "admin");
console.log(result.success ? "Admin created" : result.message);
