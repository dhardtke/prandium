function promptHidden(label: string): Promise<string> {
  process.stderr.write(label);
  const stdin = process.stdin;
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding('utf8');
  return new Promise((resolve) => {
    let value = '';
    const onData = (chunk: string): void => {
      for (const char of chunk) {
        if (char === '\u0003') {
          stdin.setRawMode(false);
          process.stderr.write('\n');
          process.exit(130);
        } else if (char === '\r' || char === '\n') {
          stdin.off('data', onData);
          stdin.setRawMode(false);
          stdin.pause();
          process.stderr.write('\n');
          resolve(value);
          return;
        } else if (char === '\u007f' || char === '\b') {
          value = value.slice(0, -1);
        } else {
          value += char;
        }
      }
    };
    stdin.on('data', onData);
  });
}

async function readFirstLine(): Promise<string> {
  const text = await new Response(Bun.stdin.stream()).text();
  return text.split(/\r?\n/, 1)[0] ?? '';
}

function fail(message: string): never {
  console.error(message);
  process.exit(1);
}

async function main(): Promise<void> {
  let password: string;
  if (process.stdin.isTTY) {
    password = await promptHidden('Password: ');
    if (password === '') {
      fail('the password must not be empty');
    }
    if ((await promptHidden('Again: ')) !== password) {
      fail('the passwords do not match');
    }
  } else {
    password = await readFirstLine();
    if (password === '') {
      fail('the password must not be empty');
    }
  }
  console.log(await Bun.password.hash(password));
}

if (import.meta.main) {
  await main();
}
