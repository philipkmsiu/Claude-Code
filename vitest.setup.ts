import os from "os";
import path from "path";
import crypto from "crypto";

// Isolate every test worker's data store from the developer's .data/db.json.
process.env.KM_DATA_DIR = path.join(
  os.tmpdir(),
  `km-test-${crypto.randomBytes(6).toString("hex")}`,
);
process.env.SESSION_SECRET = "test-secret";
