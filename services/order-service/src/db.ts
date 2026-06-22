import pg from "pg";

// En "pool" av återanvändbara databaskopplingar. Adressen kommer från
// DATABASE_URL (satt i docker-compose). Detta är samma persistenta Postgres
// som product-service använder.
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
