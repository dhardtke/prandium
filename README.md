[![Workflow badge](https://github.com/dhardtke/prandium/actions/workflows/ci.yml/badge.svg)](https://github.com/dhardtke/prandium/actions/workflows/ci.yml)

# Prandium

<!--suppress HtmlDeprecatedAttribute -->
<img align="left" src="src/frontend/icons/icon.svg" width="64" alt="Logo" />

Prandium, latin for [lunch](https://en.wiktionary.org/wiki/prandium), is a single-user content management system for organizing recipes.

_WARNING: This software is not ready for production yet as some important features and tests are still missing (although I am personally using it on a
daily basis)._

<br clear="left"/>

## Features

- Import recipes by URL from websites that use [schema.org](https://schema.org/) JSON-LD microdata
- Keep track of when and how often you cooked a recipe
- Assign tags to each recipe to easily find them later
- Mobile friendly: Responsive, fast and niche features such as keeping your screen active while you are on a recipe page

## Installation

See [Setup](docs/setup.md)

## Development

Prandium runs on [Bun](https://bun.com/) (the version in `.bun-version`).

```sh
bun install            # dependencies
bun run start:dev      # serve on http://127.0.0.1:8000 with hot reload
bun test --parallel    # the test suite
bun run fmt && bun run lint && bun run typecheck
```

It is configured through environment variables only:

| Variable                      | Default                 | Meaning                                               |
| ----------------------------- | ----------------------- | ----------------------------------------------------- |
| `PORT`                        | `8000`                  | Port to listen on                                     |
| `HOST`                        | `127.0.0.1`             | Address to listen on                                  |
| `PRANDIUM_CONFIG_DIR`         | `~/.config/prandium`    | Holds the database `data.db` and `thumbnails/`        |
| `PRANDIUM_PASSWORD_HASH`      | unset (no login)        | Hash from `bun run hash-password`; turns the login on |
| `PRANDIUM_DEV`                | unset                   | `1` turns on hot reload                               |
| `PRANDIUM_IMPORT_CONCURRENCY` | the number of CPU cores | How many recipes are imported at once                 |
| `PRANDIUM_USER_AGENT`         | a Firefox user agent    | The User-Agent sent when importing                    |

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Acknowledgements

- [Bun: A fast all-in-one JavaScript runtime](https://bun.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Oat](https://oat.ink)
- [Oxlint](https://oxc.rs/docs/guide/usage/linter)
- [Peggy](https://github.com/peggyjs/peggy)
- [IntelliJ](https://www.jetbrains.com/idea/)
- [Nextcloud Cookbook](https://github.com/nextcloud/cookbook)
