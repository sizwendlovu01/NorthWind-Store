import app from "./app";
import { getEnv } from "./lib/env";
import keepAliveCron from "./lib/cron";

const env = getEnv();

app.listen(env.PORT, () => {
  console.log("Listening on port:", env.PORT);
  if (env.NODE_ENV === "production") {
    keepAliveCron.start();
  }
});
