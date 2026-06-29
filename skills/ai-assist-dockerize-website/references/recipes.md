# Dockerize-a-Website Recipes

Build recipes for the strategies beyond plain static hosting. Read the section that matches the project. Every recipe ends by serving static output from the same `nginx:1.27-alpine` stage as the default, so the runtime image stays tiny and consistent.

## Contents

- [Strategy B — buildable site (multi-stage)](#strategy-b--buildable-site-multi-stage)
  - [Node site generators](#node-site-generators-vite-astro-eleventy-docusaurus-gatsby)
  - [MkDocs (Python)](#mkdocs-python)
  - [Hugo](#hugo)
  - [Jekyll (Ruby)](#jekyll-ruby)
- [Strategy C — raw markdown docs, no tooling](#strategy-c--raw-markdown-docs-no-tooling)
- [SPA fallback routing](#spa-fallback-routing)
- [Cache headers for static assets](#cache-headers-for-static-assets)
- [Run as non-root](#run-as-non-root)
- [Caddy alternative](#caddy-alternative)

---

## Strategy B — buildable site (multi-stage)

The pattern: a **builder** stage installs tooling and runs the generator; a **runtime** stage copies only the rendered output into nginx. Build tools never reach the final image.

The one thing that changes per framework is the **output directory**. Detect it from config, or use this table:

| Generator | Default output dir |
|---|---|
| Vite | `dist` |
| Astro | `dist` |
| Eleventy (11ty) | `_site` |
| Docusaurus | `build` |
| Gatsby | `public` |
| SvelteKit (`adapter-static`) | `build` |
| Next.js (`output: 'export'`) | `out` |
| MkDocs | `site` |
| Hugo | `public` |
| Jekyll | `_site` |

### Node site generators (Vite, Astro, Eleventy, Docusaurus, Gatsby)

```dockerfile
# syntax=docker/dockerfile:1

# --- Build stage ---
FROM node:22-alpine AS build
WORKDIR /app
# Copy manifests first so dependency install is cached across source edits.
COPY package*.json ./
# `npm ci` requires a package-lock.json and fails hard without one.
# Use it only when the lockfile exists; otherwise use `npm install`.
RUN npm ci
COPY . .
RUN npm run build

# --- Runtime stage ---
FROM nginx:1.27-alpine
COPY --from=build /app/<OUTPUT_DIR>/ /usr/share/nginx/html/
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q --spider http://localhost/ || exit 1
```

Replace `<OUTPUT_DIR>` with the framework's output dir from the table.

**Match the package manager and lockfile — this is the easiest place to ship a Dockerfile that won't build:**

- **npm with a `package-lock.json`** → `RUN npm ci` (faster, reproducible).
- **npm with no lockfile** → `RUN npm install`. `npm ci` errors out without a lockfile, so don't use it here. Check whether `package-lock.json` actually exists before choosing.
- **pnpm / yarn** → copy the matching lockfile (`pnpm-lock.yaml` / `yarn.lock`) in the manifest step and swap the commands: `pnpm install --frozen-lockfile && pnpm build`, or `yarn install --frozen-lockfile && yarn build`.

A committed lockfile is what makes the build reproducible. If the project has none, the install resolves to whatever's latest at build time — mention that to the user and suggest committing a lockfile.

### MkDocs (Python)

Great default for a documentation folder. Needs a `mkdocs.yml`; if there isn't one, generate the minimal version shown under Strategy C.

```dockerfile
# syntax=docker/dockerfile:1

FROM python:3.12-alpine AS build
WORKDIR /docs
# Pin the generator so a rebuild months later doesn't pull a different MkDocs that
# changes output or breaks the build. The bounded range avoids a surprise major bump;
# pin an exact version (check PyPI for the latest) if you want full reproducibility.
RUN pip install --no-cache-dir "mkdocs-material>=9.5,<10"
COPY . .
RUN mkdocs build

FROM nginx:1.27-alpine
COPY --from=build /docs/site/ /usr/share/nginx/html/
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q --spider http://localhost/ || exit 1
```

### Hugo

```dockerfile
# syntax=docker/dockerfile:1

FROM hugomods/hugo:ext AS build
WORKDIR /src
COPY . .
RUN hugo --minify

FROM nginx:1.27-alpine
COPY --from=build /src/public/ /usr/share/nginx/html/
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q --spider http://localhost/ || exit 1
```

### Jekyll (Ruby)

```dockerfile
# syntax=docker/dockerfile:1

FROM ruby:3.3-alpine AS build
WORKDIR /site
RUN apk add --no-cache build-base
COPY Gemfile* ./
RUN bundle install
COPY . .
RUN bundle exec jekyll build

FROM nginx:1.27-alpine
COPY --from=build /site/_site/ /usr/share/nginx/html/
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q --spider http://localhost/ || exit 1
```

---

## Strategy C — raw markdown docs, no tooling

A folder of `.md` files with nothing configured to render them. Two paths — recommend the first.

**Render it (recommended).** Browsers download raw `.md` files rather than displaying them, so a folder served as-is is a poor docs site. The lightest good-looking option is MkDocs Material. If there's no `mkdocs.yml`, generate a minimal one at the project root:

```yaml
site_name: <PROJECT_NAME>
theme:
  name: material
docs_dir: <DOCS_DIR>
```

MkDocs expects an `index.md` (or `README.md` with `use_directory_urls`) as the landing page — if the docs folder has neither, point the user at their main doc or add a tiny `index.md`. Then build with the [MkDocs Dockerfile](#mkdocs-python) above.

**Serve as-is (only if they insist).** Use the plain static Strategy A Dockerfile pointed at the docs folder. Add nginx autoindex so visitors get a browsable file listing instead of a 403, by copying this `default.conf`:

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  location / {
    autoindex on;          # directory listing, since there's no index.html
  }
}
```

…and adding `COPY default.conf /etc/nginx/conf.d/default.conf` to the Dockerfile. Be honest that `.md` files will download rather than render this way.

---

## SPA fallback routing

Add this **only** when the site is a client-side-routed SPA — React Router, Vue Router in history mode, or similar (look for a router dependency in `package.json`). A plain static site, multi-page site, or marketing page does **not** need it; adding the fallback there masks genuine 404s. When in doubt, leave it out.

A single-page app needs every unknown path to fall back to `index.html`, or deep links 404. Add this `nginx.conf`:

```nginx
server {
  listen 80;
  root /usr/share/nginx/html;
  index index.html;
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

Wire it in by adding to the runtime stage:

```dockerfile
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

---

## Cache headers for static assets

Optional, for production polish — let browsers cache hashed assets aggressively while keeping HTML fresh. Add inside the `server` block of a custom `nginx.conf`:

```nginx
location ~* \.(?:css|js|woff2?|png|jpg|jpeg|gif|svg|ico)$ {
  expires 1y;
  add_header Cache-Control "public, immutable";
}
location = /index.html {
  add_header Cache-Control "no-cache";
}
```

---

## Run as non-root

For stricter environments, base the runtime on the unprivileged image. It runs as a non-root user and listens on **8080** instead of 80, so adjust the Dockerfile and the compose port mapping.

```dockerfile
FROM nginxinc/nginx-unprivileged:1.27-alpine
COPY <SITE_DIR>/ /usr/share/nginx/html/
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
  CMD wget -q --spider http://localhost:8080/ || exit 1
```

In `docker-compose.yml`, map to the container's 8080: `- "<HOST_PORT>:8080"`, and update the healthcheck URL to `http://localhost:8080/`.

---

## Caddy alternative

When the user wants the simplest possible config or automatic file serving, Caddy serves a directory with almost no configuration. Useful for quick docs hosting.

```dockerfile
# syntax=docker/dockerfile:1
FROM caddy:2-alpine
COPY <SITE_DIR>/ /usr/share/caddy/
EXPOSE 80
```

Caddy's default site root is `/usr/share/caddy`, so just copying the folder there is enough — no config file needed for plain file serving. For custom behavior, add a `Caddyfile` and `COPY Caddyfile /etc/caddy/Caddyfile`.
