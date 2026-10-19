# Oldif Web

Bun / Next.js evidence workspace for archival research. Includes the landing page, authentication, research conversation, source inspector and pitch route `/deck/202610191111`.

## Configuration and runtime

Copy `.env.example` to `.env` and set `BACKEND_URL` to the Rust backend. All API and WebSocket traffic goes through the same-origin custom server. The browser receives no provider credentials. `PORT` and `HOSTNAME` configure the listener. Start the backend before using authentication or research.

```sh
container build --tag oldif-web:local .
container run --rm --env-file .env -p 3000:3000 oldif-web:local
```

For Docker Compose, run `docker compose up --build`. Each image builds from this repository only.

## Development

```sh
bun install --frozen-lockfile
bun run typecheck
bun test
bun run build
bun run start
```

CSS Modules provide component styling; `src/styles/globals.css` owns semantic design tokens and global resets. Translations are complete key-aligned JSON dictionaries for English, Spanish, German, Swiss German, French, Italian and Romansh. The selected language is sent with every research request. Run the custom server rather than `next start` so API and WebSocket proxying remain enabled.

Private Git dependencies require an authorized SSH agent for container builds: `container build --ssh default --tag oldif-web:local .`. The build forwards the agent only during dependency installation with lifecycle scripts disabled. Public GitHub host keys are pinned in `container/github_known_hosts` from the official GitHub metadata API.

`docker-compose.yml` is for local development only; production uses Azure Container Apps provisioned by Terraform. Every service has an HTTP health check, bounded resources, restart policy and rotating local logs. Set `IMAGE_TAG` for the local build tag. Start the separately configured backend before using the research surfaces.
