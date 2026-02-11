# invoicegenerator.xyz

## Dev

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

## Build

```bash
npm run build
```

## Cloudflare Pages

Build output: `dist`

```bash
npm run build
npx wrangler pages deploy dist --project-name invoicegenerator-xyz
```
