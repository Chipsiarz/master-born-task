import * as process from "node:process";
import { setupDb } from "./db";
import { setupApp } from "./app";

const PORT = process.env.PORT ?? 3000;

async function main() {
  const db = await setupDb();
  const app = await setupApp(db);

  app.listen(PORT, () => {
    console.log(`[server]: Server is running at http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error("Error starting the server:", err);
  process.exit(1);
});

