import "dotenv/config";
import { Server } from "./server/index.js";

(async function () {
  await Server.start();
})();
