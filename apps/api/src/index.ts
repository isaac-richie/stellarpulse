import { buildServer } from "./server.js";
import { config } from "./config.js";

const app = buildServer();

app.listen({ port: config.port, host: config.host })
  .then(() => {
    app.log.info(`API listening on ${config.host}:${config.port}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
