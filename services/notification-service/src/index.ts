import Fastify from "fastify";
import { connectRabbit, consumeEvents } from "./rabbit.js";

const app = Fastify({ logger: true });

app.get("/health", async () => {
  return { status: "ok", service: "notification-service" };
});

const port = Number(process.env.PORT) || 3000;

connectRabbit()
  .then(() => {
    // Lyssna på att en order är klar
    consumeEvents("notification-queue", "order.ready", (routingKey, order) => {
      console.log(`📣 Notis till kund: din order ${order.id} är klar för avhämtning!`);
    });
    return app.listen({ port, host: "0.0.0.0" });
  })
  .then(() => app.log.info(`notification-service listening on ${port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });