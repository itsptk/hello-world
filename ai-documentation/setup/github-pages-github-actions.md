# GitHub Pages deployment (GitHub Actions)

This runbook describes how to deploy a **static** React / webpack (or similar) app to **GitHub Pages** using **`actions/upload-pages-artifact`** and **`actions/deploy-pages`**, and lists pitfalls we hit so the next project does not repeat the same troubleshooting.

The live URL for a **project site** is:

`https://<github-username>.github.io/<repository-name>/`

## One-time repository settings

1. Open **Settings → Pages** for the repository.
2. Under **Build and deployment**, set **Source** to **GitHub Actions** (not “Deploy from a branch”).
3. Save if prompted.

Do this **before** adding `actions/configure-pages` to a workflow: that action calls the GitHub API to load Pages metadata. If Pages is not enabled yet, the API returns **404** and the workflow fails with “Get Pages site failed.” For a plain webpack build, **`configure-pages` is optional**; this project’s workflow omits it.

## Application configuration (project URLs under a subpath)

GitHub Pages serves project sites at `/<repo-name>/`, not at the domain root.

1. **Bundler public path** — Set `publicPath` / asset base to `/<repo-name>/` (trailing slash) in production builds, e.g. via `ASSET_PATH` in webpack.
2. **React Router** — If you use `BrowserRouter`, set **`basename`** to `/<repo-name>` (no trailing slash).
3. **SPA client-side routes** — GitHub Pages does not rewrite arbitrary paths to `index.html`. After build, copy **`dist/index.html` → `dist/404.html`** so deep links and refresh work (GitHub serves `404.html` for unknown paths).
4. **`package.json`** — Set **`homepage`** to `https://<username>.github.io/<repo>/` for clarity and tooling.

## GitHub Actions workflow

### Permissions

The workflow (or at least the deploy job) needs:

- `contents: read`
- `pages: write`
- `id-token: write`

### Actions versions

Use current GitHub pairing, for example:

- `actions/upload-pages-artifact@v4`
- `actions/deploy-pages@v4`

See [Using custom workflows with GitHub Pages](https://docs.github.com/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages).

### Build environment

Set **`ASSET_PATH`** and **`BASE_PATH`** from the repo name so renames stay correct:

```yaml
env:
  ASSET_PATH: /${{ github.event.repository.name }}/
  BASE_PATH: /${{ github.event.repository.name }}
```

### `npm ci` vs `npm install`

- **`npm ci`** installs only when `package.json` and **`package-lock.json` are exactly in sync**. If they drift, CI fails with errors like “Missing: … from lock file” (often optional platform packages such as `@esbuild` / `@rollup`).
- **`npm install`** is more forgiving and matches what a lenient local/CI workflow might use.

**Recommendation:** Use the **same** install command in **CI** and **Pages** workflows (e.g. both `npm install` with `--no-audit --no-fund`, or both `npm ci` after every `npm install` and committed lockfile). Mismatching them can hide lockfile problems until deploy.

To keep **`npm ci`** everywhere: run `npm install` locally, commit any **`package-lock.json`** changes, and push.

## Other gotchas (non-Pages)

- **ESLint** must pass in CI; fix import order and unused variables before relying on green checks.
- **Large DOM snapshots** can flake if libraries generate **random IDs** (e.g. progress bars). Prefer role/text assertions over brittle snapshots.

## Related documentation

- [Deployment guide (prototype options)](../guidelines/deployment-guide.md) — Surge, Vercel, Netlify, and branch-based GitHub Pages
- [Setup overview](./README.md)
