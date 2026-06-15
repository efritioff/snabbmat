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

## How to start

You need Docker Desktop running. Then, from the project root:

```bash
docker compose up --build
```

The first run downloads the base images (RabbitMQ, PostgreSQL, nginx) and may
take a few minutes. After that it is cached and fast.

## Public entry point

All traffic enters through nginx. On this machine we publish it on host port
**8080** (because Apache/XAMPP already uses port 80). Inside its container
nginx still listens on port 80.

| URL                               | What it does                          |
| --------------------------------- | ------------------------------------- |
| http://localhost:8080/health      | nginx gateway health check            |
| http://localhost:8080/api/health  | api-service health (proxied by nginx) |
| http://localhost:8080/api/        | api-service root                      |

## Useful during development

- RabbitMQ management UI: http://localhost:15672 (user/pass: see `.env`)

## Stopping

```bash
docker compose down
```

(Add `-v` to also delete the database volume.)
