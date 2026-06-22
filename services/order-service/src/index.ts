import Fastify from "fastify";
import { z } from "zod";
import { connectRabbit, publishEvent } from "./rabbit.js";
import { pool } from "./db.js";

// Exporteras så att testet kan importera appen och testa rutterna direkt.
export const app = Fastify({ logger: true });

// --- Valideringsscheman (Zod) ----------------------------------------------
// All input valideras innan vi rör databasen. Ogiltig input -> 400.
const orderSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        // Övre gräns så ett orimligt antal inte spräcker INTEGER-kolumnen i DB.
        quantity: z.number().int().positive().max(1000),
      })
    )
    .min(1, "Order must contain at least one item")
    .max(100, "Too many items in one order"),
});

const orderIdSchema = z.object({
  id: z.string().regex(/^ord-\d+$/, "Invalid order id"),
});

app.get("/health", async () => {
  return { status: "ok", service: "order-service" };
});

// --- POST /orders : skapa en order och spara den i databasen ---------------
app.post("/orders", async (request, reply) => {
  // Validera kundens input mot schemat.
  const parsed = orderSchema.safeParse(request.body);
  if (!parsed.success) {
    return reply
      .code(400)
      .send({ error: "Invalid order", details: parsed.error.issues });
  }
  const items = parsed.data.items;

  // Räkna ut totalpriset från de RIKTIGA priserna i databasen.
  const priceRes = await pool.query(
    "SELECT id, price FROM products WHERE id = ANY($1::int[])",
    [items.map((i) => i.productId)]
  );
  const priceMap = new Map<number, number>(
    priceRes.rows.map((r: { id: number; price: number }) => [r.id, r.price] as [number, number])
  );

  // Avvisa okända produkter med ett tydligt klientfel (400) i stället för att
  // låta ordern falla på en foreign key-krasch (som annars blir ett otydligt 500).
  const unknown = items
    .filter((i) => !priceMap.has(i.productId))
    .map((i) => i.productId);
  if (unknown.length > 0) {
    return reply.code(400).send({ error: "Unknown product(s)", productIds: unknown });
  }

  const total = items.reduce(
    (sum, i) => sum + (priceMap.get(i.productId) ?? 0) * i.quantity,
    0
  );

  // Spara ordern + dess rader i en transaktion (allt eller inget).
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const orderRes = await client.query(
      "INSERT INTO orders (status, total) VALUES ('PENDING', $1) RETURNING *",
      [total]
    );
    const order = orderRes.rows[0];
    for (const item of items) {
      await client.query(
        "INSERT INTO order_items (order_id, product_id, quantity) VALUES ($1, $2, $3)",
        [order.id, item.productId, item.quantity]
      );
    }
    await client.query("COMMIT");

    // Returnera/publicera items med samma fältnamn (product_id) som GET /orders/:id.
    const responseItems = items.map((i) => ({
      product_id: i.productId,
      quantity: i.quantity,
    }));
    const fullOrder = { ...order, items: responseItems };
    publishEvent("order.created", fullOrder);
    return reply.code(201).send(fullOrder);
  } catch (err) {
    // Logga det RIKTIGA felet först, så det inte döljs om ROLLBACK också fallerar.
    request.log.error(err);
    try {
      await client.query("ROLLBACK");
    } catch (rollbackErr) {
      request.log.error(rollbackErr);
    }
    return reply.code(500).send({ error: "Could not create order" });
  } finally {
    client.release();
  }
});

// --- GET /orders/:id : hämta en sparad order (med dess rader) ---------------
app.get("/orders/:id", async (request, reply) => {
  const parsed = orderIdSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ error: "Invalid order id" });
  }
  const { id } = parsed.data;
  const orderRes = await pool.query("SELECT * FROM orders WHERE id = $1", [id]);
  if (orderRes.rows.length === 0) {
    return reply.code(404).send({ error: "Order not found" });
  }
  const itemsRes = await pool.query(
    "SELECT product_id, quantity FROM order_items WHERE order_id = $1",
    [id]
  );
  return { ...orderRes.rows[0], items: itemsRes.rows };
});

const port = Number(process.env.PORT) || 3000;

// Starta servern bara i "skarp" drift — INTE under tester. vitest sätter
// NODE_ENV till "test", så det här blocket hoppas över när testet importerar appen.
if (process.env.NODE_ENV !== "test") {
  connectRabbit()                                       // anslut FÖRST
    .then(() => app.listen({ port, host: "0.0.0.0" }))  // starta servern sen
    .then(() => app.log.info(`order-service listening on ${port}`))
    .catch((err) => {
      app.log.error(err);
      process.exit(1);
    });
}