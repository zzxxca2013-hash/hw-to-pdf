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

The workflow is configured to deploy to the Cloudflare Pages project `pdfhub`.

### Required GitHub secrets
Add the following secrets to GitHub repository `Settings > Secrets and variables > Actions`:
- `CLOUDFLARE_API_TOKEN`
- `CLOUDFLARE_ACCOUNT_ID`

If the workflow still fails with `Project not found`, verify in Cloudflare Pages that the project name is indeed `pdfhub`.

## Local build test
Run these commands locally inside the project folder:

```bash
npm install
npm run build
npm run preview
```

If the site works locally, the Cloudflare Pages build should also succeed with the correct project name and account.
