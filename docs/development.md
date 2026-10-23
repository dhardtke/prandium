# Development
## Prerequisites
Install [Bun](https://bun.com/) (version 1.4.4 or newer), then install the dependencies:
```shell
bun install
```

## DEV Server
```shell
bun run dev
```
This rebuilds the assets (SASS and client TypeScript) and the icon sprite whenever they change and restarts the server in debug mode on changes.
Additional arguments are passed to the server, e.g. `bun run dev --port=9000`.

### Spawn HTTPs server
```shell
# execute beforehand
# openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 --nodes
bun src/main.ts --secure --key=key.pem --cert=cert.pem
```

## Tests
```shell
bun test
# with coverage (written to out/coverage/lcov.info)
bun run test:coverage
```

## Formatting, Linting and Type Checking
```shell
bun fmt
bun run lint
bun run typecheck
```

## Building
```shell
bun run build
```
creates the release build in `out/`. Run it with `bun out/server.js`.

## Other Scripts
- `bun run build:icons` - regenerates `assets/icons.svg` from the icons used in `src/tpl/templates/_components/icon.tsx`
- `bun run build:ingredient-parser` - regenerates `src/data/parse/ingredient/parser.js` from `parser.pegjs`
- `bun run insert-example-data` - inserts example recipes into the database in the default config directory
