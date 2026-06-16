import Fastify from "fastify";

const app = Fastify({ logger: true });

app.get("/health", async () => {
  return { status: "ok", service: "notification-service" };
});

const port = Number(process.env.PORT) || 3000;
app
  .listen({ port, host: "0.0.0.0" })
  .then(() => app.log.info(`notification-service listening on ${port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });