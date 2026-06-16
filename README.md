# Snabbmat — Distributed Fast-Food Ordering System

An event-driven backend inspired by fast-food chain ordering systems
(Max / McDonald's). Built with Docker Compose, RabbitMQ, PostgreSQL and an
nginx gateway.

## Architecture (so far)

```
client ──▶ nginx :80 ──▶ api-service ──▶ (RabbitMQ events) ──▶ other services
                                    └──▶ PostgreSQL
```

Only **nginx** is exposed to the outside world (port 80). All internal
services live on a private Docker network and cannot be reached directly.

> Note: after `docker compose up --build`, if requests 404, restart nginx so it
> picks up fresh service IPs: `docker compose restart nginx`.

## How to start

You need Docker Desktop running. Then, from the project root:

```bash
docker compose up --build
```

The first run downloads the base images (RabbitMQ, PostgreSQL, nginx) and may
take a few minutes. After that it is cached and fast.

## Public entry point

All traffic enters through nginx on **port 80** — the single public entry
point. Internal services are not reachable directly from outside.

| URL                            | What it does                          |
| ------------------------------ | ------------------------------------- |
| http://localhost/health        | nginx gateway health check            |
| http://localhost/api/products  | the menu (product-service, from PostgreSQL) |
| http://localhost/api/orders    | create an order (POST, order-service) |

> If port 80 is already in use on your machine (e.g. Apache/XAMPP), either stop
> that service or change the nginx mapping in `docker-compose.yml` to `"8080:80"`.

## Useful during development

- RabbitMQ management UI: http://localhost:15672 (user/pass: see `.env`)

## Stopping

```bash
docker compose down
```

(Add `-v` to also delete the database volume.)
