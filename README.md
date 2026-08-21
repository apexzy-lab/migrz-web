# Migrz Web

The production website for [Migrz](https://migrzz.com), an achievement-based immigration strategy service for accomplished professionals.

## What is included

- Responsive marketing site based on the Migrz Merit Index design system
- Ten detailed immigration pathway guides covering the United States, United Kingdom, Canada, Australia, Germany, and the UAE
- About, process, results, customer, differentiation, and FAQ pages
- Shared responsive navigation, footer, and assessment calls to action
- Canonical metadata, Open Graph metadata, JSON-LD, sitemap, robots.txt, and web manifest
- Rendered-route and content coverage tests

Program information is educational and links to the relevant official government guidance. It is not legal advice and should be reviewed when immigration rules change.

## Local development

Requirements: Node.js 22.13 or newer.

```bash
npm install
npm run dev
```

The development server runs at `http://localhost:3000`.

## Verification

```bash
npm run build
npm run lint
node --test tests/rendered-html.test.mjs
```

## Deployment

The repository is connected to the existing `migrz-web` Cloudflare Worker through Cloudflare Workers Builds.

- Production branch: `main`
- Build command: `npm run build`
- Deploy command: `npx wrangler deploy`
- Production preview: [migrz-web.apexzy.workers.dev](https://migrz-web.apexzy.workers.dev)

Every push to `main` triggers a production build and deployment. Non-production branches are configured for preview builds so proposed changes can be reviewed before merging.

The Worker name and compatibility settings are declared in `vite.config.ts`; the Cloudflare Vite plugin writes the deployment configuration into the production build output.
