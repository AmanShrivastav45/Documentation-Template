# Docroom

A minimal documentation platform. Vite + React + TypeScript + Tailwind + MDX.

## Adding a doc

To add a doc, drop an `.mdx` file into `docs/`. Folders become tree branches.
`index.mdx` is the folder's landing page. Nothing else to configure.

Optionally export metadata from any doc:

```js
export const meta = { title: "Data Flow", order: 2 };
```

Without it, the title is derived from the filename and pages sort alphabetically.

## Development

```
npm install
npm run dev
```
