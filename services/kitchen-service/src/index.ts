import Fastify from "fastify";
import { connectRabbit, consumeEvents, publishEvent } from "./rabbit.js";
import { pool } from "./db.js";

// Exporteras så testet kan importera appen och testa rutterna direkt.
export const app = Fastify({ logger: true });

app.get("/health", async () => {
  return { status: "ok", service: "kitchen-service" };
});

// --- GET /orders : ordrar som köket behöver laga (inte klara än) -----------
// Det här är kökspersonalens "skärm": inkommande ordrar i realtid (poll:as).
app.get("/orders", async () => {
  const result = await pool.query(
    `SELECT id, status, total, created_at
       FROM orders
      WHERE status IN ('PENDING', 'IN_PROGRESS')
      ORDER BY created_at`
  );
  return result.rows;
});

// --- POST /orders/:id/ready : kökspersonalen markerar en order som klar -----
app.post("/orders/:id/ready", async (request, reply) => {
  const { id } = request.params as { id: string };

  const result = await pool.query(
    "UPDATE orders SET status = 'READY' WHERE id = $1 RETURNING *",
    [id]
  );
  if (result.rows.length === 0) {
    return reply.code(404).send({ error: "Order not found" });
  }

  const order = result.rows[0];
  // Tala om för resten av systemet att ordern är klar -> notification-service.
  publishEvent("order.ready", order);
  return order;
});

const port = Number(process.env.PORT) || 3000;

if (process.env.NODE_ENV !== "test") {
  connectRabbit()
    .then(() => {
      // När en ny order kommer in: markera att köket tagit emot den.
      // (Köket publicerar INTE order.ready automatiskt längre — personalen
      //  gör det manuellt via POST /orders/:id/ready.)
      consumeEvents("kitchen-queue", "order.created", async (_routingKey, order) => {
        console.log(`👨‍🍳 Köket tog emot order ${order.id}`);
        await pool.query(
          "UPDATE orders SET status = 'IN_PROGRESS' WHERE id = $1 AND status = 'PENDING'",
          [order.id]
        );
      });
      return app.listen({ port, host: "0.0.0.0" });
    })
    .then(() => app.log.info(`kitchen-service listening on ${port}`))
    .catch((err) => {
      app.log.error(err);
      process.exit(1);
    });
}
