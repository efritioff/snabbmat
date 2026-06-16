import Fastify from "fastify";
import { connectRabbit, publishEvent } from "./rabbit.js";

const app = Fastify({ logger: true });

app.get("/health", async () => {
  return { status: "ok", service: "order-service" };
});

const orders: any[] = [];   // alla ordrar hamnar här
let nextId = 1;             // för att ge varje order ett eget nummer

app.post("/orders", async (request, reply) => {
  // a) Läs vad kunden skickade (kommer i body)
  const body = request.body as { items: any[] };

  // b) Skapa order-objektet
  const order = {
    id: `ord-${nextId++}`,
    items: body.items,
    status: "PENDING",
  };

  // c) Spara den
  orders.push(order);

  publishEvent("order.created", order);

  // d) Svara med 201 = "skapad"
  return reply.code(201).send(order);
});

const port = Number(process.env.PORT) || 3000;

connectRabbit()                                       // anslut FÖRST
  .then(() => app.listen({ port, host: "0.0.0.0" }))  // starta servern sen
  .then(() => app.log.info(`order-service listening on ${port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });