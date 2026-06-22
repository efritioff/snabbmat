import Fastify from "fastify";
import { z } from "zod";
import pg from "pg";

const app = Fastify({ logger: true });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

// Validering: produkt-id måste vara ett positivt heltal.
// z.coerce gör om strängen från URL:en ("3") till ett tal innan kontrollen.
const productIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

app.get("/health", async () => {
  return { status: "ok", service: "product-service" };
});


app.get("/products", async () => {
  const result = await pool.query("SELECT * FROM products ORDER BY id");
  return result.rows;
});


app.get("/products/:id", async (request, reply) => {
  const parsed = productIdSchema.safeParse(request.params);
  if (!parsed.success) {
    return reply.code(400).send({ error: "Invalid product id" });
  }
  const id = parsed.data.id;
  const result = await pool.query("SELECT * FROM products WHERE id = $1", [id]);

  if (result.rows.length === 0) {
    return reply.code(404).send({ error: "Product not found" });
  }
  return result.rows[0];
});

const port = Number(process.env.PORT) || 3000;
app
  .listen({ port, host: "0.0.0.0" })
  .then(() => app.log.info(`product-service listening on ${port}`))
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
