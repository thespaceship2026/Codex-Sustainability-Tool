import { spawnSync } from "node:child_process";

import { defaultDbPath, removeDbBundle } from "./db-utils";

removeDbBundle(defaultDbPath);

for (const command of [["npm", "run", "db:migrate"], ["npm", "run", "db:seed"]]) {
  const result = spawnSync(command[0], command.slice(1), {
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}
