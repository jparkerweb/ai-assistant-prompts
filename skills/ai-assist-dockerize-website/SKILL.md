---
name: ai-assist-dockerize-website
description: "Guide the user through containerizing and serving a simple website or documentation folder with Docker — inspects the project to detect what to serve (ready-to-serve static HTML, a buildable site that emits static output, or a raw markdown/docs folder that needs rendering), generates a Dockerfile, .dockerignore, docker-compose.yml, helper run/build commands, and a 'Running with Docker' README section, then offers to build and smoke-test the container and publish the image to Docker Hub or GHCR. Uses nginx:alpine for static content and a multi-stage build when the site must be generated. Only invoke when the user explicitly types /ai-assist-dockerize-website. Never auto-trigger from general conversation about Docker, containers, websites, or Dockerfiles."
argument-hint: "[path-to-site-or-docs-folder] [--port <port>]"
---

# Dockerize a Website

This skill is invoked **manually** — only when the user explicitly runs `/ai-assist-dockerize-website`. Don't auto-trigger it from general talk about Docker, containers, or websites.

Guide the user from a project folder to a working Docker container that serves their site or documentation. The skill is **interactive and guided**, not a one-shot script: inspect the project, propose a sensible plan, confirm a few details, generate the files, then offer to build/test and publish.

The spine is: **detect → confirm → generate → offer to test → offer to publish.** Lead with a good default at every step so the user is confirming, not configuring from scratch.

## When to use

Use this whenever the user wants to serve a *static* website or a *documentation* folder out of a container — loose HTML/CSS/JS, the build output of a site generator, or a folder of markdown docs. The "project with a docs folder" case is the bullseye.

## Out of scope — dynamic apps

This skill serves static content. If the project is a **dynamic app** that runs code per request — an Express/Fastify/Nest server, Next.js in SSR mode, Flask/Django/FastAPI, a Go/Rust web server, anything with a long-running `start`/`serve` process and a port it listens on — stop and say so plainly. Containerizing those means basing the image on the app's own runtime and running its start command, which is a different job. Detect this case (see below), tell the user, and don't half-build a static image that won't actually run their app.

Don't leave them stranded, though. After declining, offer a real next step: a correct container for a dynamic app is based on the app's own runtime (e.g. `node:22-alpine`), installs its dependencies, runs the start command, and exposes the port the app listens on. Offer to hand-write that separately — it's just outside this skill's static-hosting scope.

## Step 1 — Inspect and classify the project

Before asking anything, look at what's there so the proposal is concrete. If the user named a folder (argument or in their message), focus on it; otherwise scan the working directory.

Classify into one of four strategies:

| Signals found | Strategy |
|---|---|
| An `index.html` ready to serve — at the project root, or in `dist/`, `build/`, `out/`, `public/`, `_site/`, `site/`, `www/` | **A · Ready static** — single-stage nginx, copy the folder in |
| Site-generator tooling: `package.json` with a `build` script + a static framework (Vite, Astro, Eleventy, Docusaurus, Gatsby, SvelteKit static), or a config file (`mkdocs.yml`, `docusaurus.config.*`, `astro.config.*`, `_config.yml`, `hugo.toml`/`config.toml`, `.eleventy.js`) | **B · Buildable** — multi-stage build → nginx |
| A folder of `.md` docs with **no** generator configured | **C · Raw docs** — offer to render (recommended) or serve as-is |
| A long-running server: `package.json` `start` runs a server (`node server.js`), source calls `.listen()`, or a web framework (Express, Next SSR, Flask, Django, FastAPI, Go/Rust server) | **D · Dynamic app** — stop, explain, don't build |

State your finding in one line — e.g. *"Found a built site in `dist/` with an `index.html`, so I'll serve it directly with nginx (strategy A)."* — and let the user correct you if the detection is off.

For **strategy B and C**, the build/render details live in `references/recipes.md`. Read that file when you land on those paths — it has the multi-stage Dockerfiles per generator (Node SSGs, MkDocs, Hugo, Jekyll), the SPA fallback config, the raw-markdown render path, caching headers, the non-root variant, and a Caddy alternative.

## Step 2 — Confirm the details

Pre-fill every answer from Step 1 so these are quick confirmations, not an interrogation:

- **What to serve** — the folder (strategy A) or the build output directory (strategy B/C). Show the path you detected.
- **Port** — what host port to expose. Default `8080` (avoids clashing with anything already on `80`). Honor `--port` if given.
- **Image / container name** — propose one lowercase-hyphenated name for both. Default to the **project folder** name, but prefer a more meaningful name when one is obvious — a `package.json` `name`, or a clear title in the README — e.g. favor `marketing-site` over a generic folder like `app` or `vite-app`. Always let the user override.
- **Compose?** — yes by default (one-command up/down). Mention they can skip it.
- For **strategy C**, confirm they want the docs *rendered* (recommended — browsers download raw `.md` instead of displaying it) versus served as raw files.

Skip questions whose answers are obvious or already given. The user invited a guided flow, not a form.

## Step 3 — Generate the artifacts

Generate all of these, tailored to the chosen strategy. Substitute the real folder, port, and names — don't leave placeholders in the files you write.

### Dockerfile (strategy A — ready static)

```dockerfile
# syntax=docker/dockerfile:1
FROM nginx:1.27-alpine

# Copy the site into nginx's web root.
COPY <SITE_DIR>/ /usr/share/nginx/html/

EXPOSE 80

# Fail the container's health check if nginx stops serving.
# busybox wget ships in the alpine image, so no extra install is needed.
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q --spider http://localhost/ || exit 1
```

Pin the base image to a real minor tag (e.g. `nginx:1.27-alpine`) rather than the floating `nginx:alpine`, so a rebuild months from now doesn't silently pull a different nginx. Mention this so the user knows to bump it deliberately.

The build context is the project root (compose uses `build: .`), so `COPY` paths are relative to it: copy the served folder by its path from the root — `COPY public/ …` when the site lives in `public/`, or `COPY . …` when the site *is* the project root (then lean on `.dockerignore` to keep junk out).

For **strategy B/C**, use the matching multi-stage Dockerfile from `references/recipes.md` — a builder stage runs the generator, and only its static output is copied into the nginx stage, so build tooling never ships in the final image.

### .dockerignore

Keep the build context small and the image clean:

```gitignore
.git
.gitignore
node_modules
npm-debug.log*
.env
.env.*
.DS_Store
Thumbs.db
Dockerfile*
.dockerignore
docker-compose*.yml
```

Tailor it to the project. For a multi-stage build (strategy B/C), also ignore the local build-output directory (`dist`, `build`, `_site`, `out`, `site`, …) — it's regenerated inside the image, and shipping a stale host copy into the build context only bloats it. The "don't ignore your content" rule is about *source* you serve directly (strategy A), not generated output.

### docker-compose.yml

```yaml
services:
  web:
    build: .
    image: <IMAGE_NAME>:latest
    container_name: <CONTAINER_NAME>
    ports:
      - "<HOST_PORT>:80"
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "wget", "-q", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 3s
      retries: 3
      start_period: 5s
```

No top-level `version:` key — it's obsolete in Compose v2 and prints a warning.

### Helper commands + README section

Append a "Running with Docker" section to the project's `README.md` (or create a short `DOCKER.md` if there's no README). The commands are identical in PowerShell and bash, so no per-shell variants are needed.

The block below is the template; its outer 4-backtick fence is only the boundary so the inner blocks display here. When you write the actual file, use normal **3-backtick** fences for the `bash` blocks — don't copy the 4-backtick wrapper.

````markdown
## Running with Docker

This site is served by nginx in a container.

### Quick start (Docker Compose)

```bash
docker compose up -d --build      # build the image and start in the background
# open http://localhost:<HOST_PORT>
docker compose logs -f            # follow logs
docker compose down               # stop and remove
```

### Without Compose

```bash
docker build -t <IMAGE_NAME> .
docker run -d --name <CONTAINER_NAME> -p <HOST_PORT>:80 <IMAGE_NAME>
docker stop <CONTAINER_NAME> && docker rm <CONTAINER_NAME>
```
````

After writing the files, summarize what you created and the one command to run it.

## Step 4 — Offer to build and smoke-test

Don't build automatically — the user may not have Docker running, or may want to review the files first. Ask: *"Want me to build it and confirm it serves?"*

If yes:

1. Check the daemon is up first with `docker info`. If it fails, tell the user to start Docker Desktop and stop here — the files are already written and ready whenever they are.
2. Build and start: `docker compose up -d --build` (or `docker build` + `docker run` if they skipped compose).
3. Smoke-test the URL — request `http://localhost:<HOST_PORT>/` and confirm an HTTP 200 with non-empty HTML. On Windows use `curl.exe` or PowerShell's `Invoke-WebRequest`; give nginx a second to come up and retry once or twice before calling it a failure.
4. Report the result. Leave it running if they want to look at it, or tear down with `docker compose down`. If you started a throwaway container by hand, clean it up.

If the build or smoke-test fails, read the actual error (`docker compose logs`) and fix the real cause — a wrong output directory, a missing build step, a port already in use — rather than guessing.

## Step 5 — Offer to publish (optional)

Once it runs locally, offer to push the image to a registry so it can be shared or deployed. Only do this if the user wants it. Read `references/registry-publish.md` for the Docker Hub and GHCR walkthrough (login, tag, push, image naming, and the multi-arch `--platform` note for Apple-Silicon-built images headed to amd64 servers).

## Conventions and rationale

- **nginx:alpine for static** — tiny, battle-tested, zero app code to maintain. Reach for the Caddy alternative (in recipes) only when the user wants dead-simple config or automatic file serving.
- **Multi-stage when building** — the final image carries only the rendered site, not Node/Python/Hugo and their caches. Smaller image, smaller attack surface.
- **Pin the base image** to a minor tag so rebuilds are reproducible.
- **Default to port 8080** on the host to avoid colliding with whatever already owns `80`.
- **Non-root** is available via `nginxinc/nginx-unprivileged` (recipes) for stricter environments — note it as an option rather than forcing it.
- **No secrets in the image** — static hosting rarely needs any; if the user mentions API keys or env config, that's a sign this is really a dynamic app (strategy D).

## Reference files

- `references/recipes.md` — multi-stage Dockerfiles per generator (Node SSGs, MkDocs, Hugo, Jekyll), the raw-markdown render path, SPA fallback, caching headers, non-root, and the Caddy alternative. Read it for strategy B or C.
- `references/registry-publish.md` — pushing the image to Docker Hub or GHCR. Read it for Step 5.
