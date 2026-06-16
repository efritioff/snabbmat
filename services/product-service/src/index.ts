import Fastify from "fastify";
import pg from "pg";

const app = Fastify({ logger: true });
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });



app.get("/health", async () => {
  return { status: "ok", service: "product-service" };
});


app.get("/products", async () => {
  const result = await pool.query("SELECT * FROM products ORDER BY id");
  return result.rows;
});


app.get("/products/:id", async (request, reply) => {
  const { id } = request.params as { id: string };
  const result = await pool.query("SELECT * FROM products WHERE id = $1", [Number(id)]);

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
