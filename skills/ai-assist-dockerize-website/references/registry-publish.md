# Publishing the Image to a Registry

Read this for Step 5 — pushing the locally-built image so it can be pulled on another machine, shared, or deployed. Only do this when the user asks for it. Walk them through whichever registry they use; don't push anywhere on their behalf without confirmation.

## Picking a registry

- **Docker Hub** — easiest if they already have a Docker ID. Public repos are free.
- **GitHub Container Registry (GHCR)** — natural fit when the code already lives on GitHub; image visibility follows the repo, and it's convenient for GitHub Actions.

Ask which they want (or read it from context — a GitHub remote suggests GHCR).

## Docker Hub

```bash
docker login                                   # prompts for Docker ID + password/token

# Tag the local image as <user>/<repo>:<tag>
docker tag <IMAGE_NAME>:latest <DOCKER_ID>/<REPO>:latest
docker tag <IMAGE_NAME>:latest <DOCKER_ID>/<REPO>:<VERSION>   # also tag a version, e.g. 1.0.0

docker push <DOCKER_ID>/<REPO>:latest
docker push <DOCKER_ID>/<REPO>:<VERSION>
```

Anyone can then `docker pull <DOCKER_ID>/<REPO>:latest`. Prefer an access token over a password for `docker login` — create one in Docker Hub → Account Settings → Security.

## GitHub Container Registry (GHCR)

Images live at `ghcr.io/<OWNER>/<REPO>`. Authenticate with a Personal Access Token (classic) that has the `write:packages` scope, or the automatic `GITHUB_TOKEN` inside Actions.

```bash
echo $CR_PAT | docker login ghcr.io -u <GITHUB_USERNAME> --password-stdin

docker tag <IMAGE_NAME>:latest ghcr.io/<OWNER>/<REPO>:latest
docker tag <IMAGE_NAME>:latest ghcr.io/<OWNER>/<REPO>:<VERSION>

docker push ghcr.io/<OWNER>/<REPO>:latest
docker push ghcr.io/<OWNER>/<REPO>:<VERSION>
```

New GHCR packages default to **private**. To make it public, go to the package page on GitHub → Package settings → Change visibility. To link it to the source repo (so it appears under the repo's Packages), add a label to the Dockerfile:

```dockerfile
LABEL org.opencontainers.image.source="https://github.com/<OWNER>/<REPO>"
```

## Tagging advice

- Always push a specific version tag (`1.0.0`) **in addition to** `latest`, so deployments can pin and roll back. `latest` alone is a moving target.
- Use immutable, meaningful versions — semver or a git short SHA.

## Multi-architecture note

An image built on Apple Silicon or a Windows/ARM machine defaults to that CPU architecture and may not run on a typical `linux/amd64` cloud server. Build for the target platform explicitly, or build a multi-arch image with Buildx:

```bash
# Single target platform:
docker build --platform linux/amd64 -t <IMAGE_NAME> .

# Multi-arch, built and pushed in one step:
docker buildx build --platform linux/amd64,linux/arm64 \
  -t <DOCKER_ID>/<REPO>:latest --push .
```

`buildx build --push` builds and publishes together; it does not load the multi-arch result into the local image store, which is expected.

## After pushing

Give the user the one-line pull/run command for the published image so they can verify from another machine:

```bash
docker run -d -p <HOST_PORT>:80 <REGISTRY_PATH>:latest
```
