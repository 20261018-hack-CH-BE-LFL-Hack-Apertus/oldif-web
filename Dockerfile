# syntax=docker/dockerfile:1
FROM oven/bun:1.4.3 AS build
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends git openssh-client && rm -rf /var/lib/apt/lists/*
COPY container/github_known_hosts /etc/ssh/ssh_known_hosts
COPY package.json bun.lock ./
RUN --mount=type=ssh bun install --frozen-lockfile --ignore-scripts
COPY . .
RUN bun run build
FROM oven/bun:1.4.3
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build --chown=bun:bun /app /app
USER bun
EXPOSE 3000
CMD ["bun", "server.mjs"]
