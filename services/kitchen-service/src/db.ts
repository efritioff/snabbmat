import pg from "pg";

// Samma persistenta Postgres som order-service. Köket läser och uppdaterar
// orderstatus här (DATABASE_URL sätts i docker-compose).
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
