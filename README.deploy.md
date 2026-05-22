# Deployment Instructions

## Cloudflare Pages

This project builds successfully with Vite and deploys from `dist/`.

### Recommended Cloudflare Pages settings
- Repository: `zzxxca2013-hash/hw-to-pdf`
- Branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`

### GitHub Actions
This repo already contains a Cloudflare Pages workflow:
- `.github/workflows/deploy-cloudflare-pages.yml`

The workflow deploys with these secrets:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`
- `CLOUDFLARE_PROJECT_NAME`

`CLOUDFLARE_PROJECT_NAME` must exactly match the name of the Cloudflare Pages project in your account.
If the workflow still fails with `Project not found`, the project name or account ID is incorrect, or the token does not have access to that Pages project.

### Recommended fallback
If Cloudflare Pages continues to fail, this repository now also supports direct GitHub Pages deployment from `.github/workflows/deploy-github-pages.yml`.

## Local build test
Run these commands locally inside the project folder:

```bash
npm install
npm run build
npm run preview
```

If the site works locally, the Cloudflare Pages build should also succeed with the correct project name and account.
