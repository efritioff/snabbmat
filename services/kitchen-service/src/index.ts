import Fastify from "fastify";
import { connectRabbit, consumeEvents, publishEvent } from "./rabbit.js";

const app = Fastify({ logger: true });

app.get("/health", async () => {
  return { status: "ok", service: "kitchen-service" };
});

const port = Number(process.env.PORT) || 3000;

connectRabbit()
  .then(() => {
    // Börja lyssna på nya ordrar
    consumeEvents("kitchen-queue", "order.created", (routingKey, order) => {
      console.log(`👨‍🍳 Köket tog emot order ${order.id} — lagar maten...`);

      // Maten är klar — skicka vidare
      publishEvent("order.ready", order);
    });
    return app.listen({ port, host: "0.0.0.0" });
  })
  .then(() => app.log.info(`kitchen-service listening on ${port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
