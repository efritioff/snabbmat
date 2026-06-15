import Fastify from "fastify";

// Fastify is our HTTP framework. `logger: true` prints each request to the
// console, which is handy when watching `docker compose up`.
const app = Fastify({ logger: true });

// Health endpoint. nginx forwards /api/health here so we can prove the chain
// browser -> nginx -> api-service works end to end.
app.get("/health", async () => {
  return { status: "ok", service: "api-service" };
});

// A friendly root so hitting /api/ shows something.
app.get("/", async () => {
  return { message: "Snabbmat API is running" };
});

// Start the server. We listen on 0.0.0.0 (not localhost) so the container
// accepts connections from nginx over the docker network.
const port = Number(process.env.PORT) || 3000;
app
  .listen({ port, host: "0.0.0.0" })
  .then(() => app.log.info(`api-service listening on ${port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
