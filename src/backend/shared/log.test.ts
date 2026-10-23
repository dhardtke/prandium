import { describe, expect, test } from 'bun:test';
import { closeSync, fstatSync, openSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { useLogs, useTempDir } from '../testing.ts';
import { formatEntry, isJournalStream, log, setLogSink } from './log.ts';

const NOW = new Date(2026, 9, 6, 9, 5, 7);

const JOURNALD = { journald: true, colors: false, now: NOW };
const TERMINAL = { journald: false, colors: false, now: NOW };
const COLORED = { journald: false, colors: true, now: NOW };
const STACK = 'Error: boom\n    at here';

describe('formatEntry', () => {
  test('prefixes every line of a multi-line error with <3> in journald mode', () => {
    expect(formatEntry({ level: 'error', topic: 'http', message: 'boom', error: STACK }, JOURNALD)).toBe('<3>http boom\n<3>Error: boom\n<3>    at here');
  });

  test('uses <6> for info and <4> for warn in journald mode', () => {
    expect(formatEntry({ level: 'info', topic: 'db', message: 'applied 001' }, JOURNALD)).toBe('<6>db applied 001');
    expect(formatEntry({ level: 'warn', topic: 'auth', message: 'wrong password' }, JOURNALD)).toBe('<4>auth wrong password');
  });

  test('starts with the local time in a terminal, naming warn and error on the first line only', () => {
    expect(formatEntry({ level: 'info', topic: 'db', message: 'applied 001' }, TERMINAL)).toBe('09:05:07 db applied 001');
    expect(formatEntry({ level: 'warn', topic: 'auth', message: 'wrong password' }, TERMINAL)).toBe('09:05:07 WARN auth wrong password');
    expect(formatEntry({ level: 'error', topic: 'http', message: 'boom', error: STACK }, TERMINAL)).toBe('09:05:07 ERROR http boom\nError: boom\n    at here');
  });

  test('shows a payload after the message', () => {
    expect(formatEntry({ level: 'info', topic: 'http', message: 'POST /api/x 201 3ms', payload: '{"a":1}' }, TERMINAL)).toBe(
      '09:05:07 http POST /api/x 201 3ms {"a":1}',
    );
  });

  test('colors the time, the level, the topic and the payload, naming info too', () => {
    expect(formatEntry({ level: 'info', topic: 'http', message: 'POST /api/x 201 3ms', payload: '{"a":1}' }, COLORED)).toBe(
      '\x1b[90m09:05:07\x1b[0m \x1b[1;32mINFO \x1b[0m \x1b[35mhttp\x1b[0m POST /api/x 201 3ms \x1b[36m{"a":1}\x1b[0m',
    );
    expect(formatEntry({ level: 'error', topic: 'http', message: 'boom', error: STACK }, COLORED)).toBe(
      '\x1b[90m09:05:07\x1b[0m \x1b[1;31mERROR\x1b[0m \x1b[35mhttp\x1b[0m boom\nError: boom\n    at here',
    );
  });

  test('lets Bun.inspect color an error, and never in journald mode', () => {
    const entry = { level: 'error' as const, topic: 'db', message: 'failed', error: new Error('boom') };
    expect(formatEntry(entry, COLORED)).toContain('\x1b[');
    expect(formatEntry(entry, JOURNALD)).not.toContain('\x1b[');
  });
});

describe('log', () => {
  const logs = useLogs();

  test('writes the topic and the message at the level asked for', () => {
    log.info('db', 'applied 001');
    log.warn('auth', 'wrong password');
    log.error('server', 'failed to start');
    expect(logs()).toEqual([
      { level: 'info', text: 'db applied 001' },
      { level: 'warn', text: 'auth wrong password' },
      { level: 'error', text: 'server failed to start' },
    ]);
  });

  test('appends the stack of an error', () => {
    log.error('http', 'GET /x 500 1ms', new Error('boom'));
    const [entry] = logs();
    expect(entry?.text).toStartWith('http GET /x 500 1ms\n');
    expect(entry?.text).toContain('boom');
    expect(entry?.text).toContain('log.test.ts');
  });

  test("appends an error's cause and an AggregateError's inner errors", () => {
    log.error('db', 'failed', new Error('outer', { cause: new Error('the inner reason') }));
    let parseFailure: unknown;
    try {
      new Bun.Transpiler({ loader: 'ts' }).transformSync('export const oops: = ;');
    } catch (err) {
      parseFailure = err;
    }
    expect(parseFailure).toBeInstanceOf(AggregateError);
    log.error('static', 'could not transpile', parseFailure);
    const [cause, aggregate] = logs();
    expect(cause?.text).toContain('the inner reason');
    expect(aggregate?.text).toContain('Unexpected =');
  });

  test('appends a value that is not an Error', () => {
    log.error('server', 'unhandled rejection', 'just a string');
    expect(logs()).toEqual([{ level: 'error', text: 'server unhandled rejection\njust a string' }]);
  });
});

describe('isJournalStream', () => {
  const dir = useTempDir();

  test('holds only for the dev:ino of the file open at the fd', () => {
    const path = join(dir(), 'stream');
    writeFileSync(path, '');
    const fd = openSync(path, 'r');
    try {
      const st = fstatSync(fd, { bigint: true });
      expect(isJournalStream(`${st.dev}:${st.ino}`, fd)).toBe(true);
      expect(isJournalStream(`${st.dev}:${st.ino + 1n}`, fd)).toBe(false);
      expect(isJournalStream(undefined, fd)).toBe(false);
      expect(isJournalStream('garbage', fd)).toBe(false);
    } finally {
      closeSync(fd);
    }
  });
});

describe('setLogSink', () => {
  test('returns a function that restores the previous sink', () => {
    const first: string[] = [];
    const second: string[] = [];
    const restoreFirst = setLogSink((entry) => {
      first.push(`${entry.topic} ${entry.message}`);
    });
    const restoreSecond = setLogSink((entry) => {
      second.push(`${entry.topic} ${entry.message}`);
    });
    log.info('a', 'one');
    restoreSecond();
    log.info('b', 'two');
    restoreFirst();
    expect(second).toEqual(['a one']);
    expect(first).toEqual(['b two']);
  });
});
