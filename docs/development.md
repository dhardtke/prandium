# Development
## SASS / CSS
Install [Dart SASS](https://github.com/sass/dart-sass)

## JetBrains IDEs
If you use any of the Jetbrains IDEs for development you may follow [this comment](https://youtrack.jetbrains.com/issue/WEB-41607#focus=streamItem-27-4160152.0-0)
to configure your IDE to work best with Deno.

## Watchers
We recommend using JetBrain's termins


## DEV Server
### Spawn HTTPs server
```shell
# execute beforehand
# openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 --nodes
deno run --allow-all dev/dev_server.ts --secure=true --key=key.pem --cert=cert.pem
```
