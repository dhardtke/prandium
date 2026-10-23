import { fstatSync } from 'node:fs';

export type LogLevel = 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  topic: string;
  message: string;
  payload?: string;
  error?: unknown;
}

export type LogSink = (entry: LogEntry) => void;

export interface FormatOptions {
  journald: boolean;
  colors: boolean;
  now: Date;
}

const PRIORITIES: Record<LogLevel, string> = { info: '<6>', warn: '<4>', error: '<3>' };
const LABELS: Record<LogLevel, string> = { info: '', warn: 'WARN ', error: 'ERROR ' };

const RESET = '\x1b[0m';
const GRAY = '\x1b[90m';
const CYAN = '\x1b[36m';
const MAGENTA = '\x1b[35m';
const LEVEL_COLORS: Record<LogLevel, string> = { info: '\x1b[1;32m', warn: '\x1b[1;33m', error: '\x1b[1;31m' };

function paint(color: string, text: string): string {
  return `${color}${text}${RESET}`;
}

// Bun.inspect, unlike err.stack, shows a `cause` and an AggregateError's inner errors.
function renderError(error: unknown, colors: boolean): string {
  return typeof error === 'string' ? error : Bun.inspect(error, { colors });
}

export function entryText(entry: LogEntry): string {
  const line = `${entry.topic} ${entry.message}${entry.payload === undefined ? '' : ` ${entry.payload}`}`;
  return entry.error === undefined ? line : `${line}\n${renderError(entry.error, false)}`;
}

// journald reads a leading `<N>` as the priority of each line separately, a stack's lines included.
export function formatEntry(entry: LogEntry, options: FormatOptions): string {
  if (options.journald) {
    return entryText(entry)
      .split('\n')
      .map((line) => `${PRIORITIES[entry.level]}${line}`)
      .join('\n');
  }
  const time = [options.now.getHours(), options.now.getMinutes(), options.now.getSeconds()].map((part) => String(part).padStart(2, '0')).join(':');
  if (!options.colors) {
    return `${time} ${LABELS[entry.level]}${entryText(entry)}`;
  }
  let text = `${paint(GRAY, time)} ${paint(LEVEL_COLORS[entry.level], entry.level.toUpperCase().padEnd(5))} ${paint(MAGENTA, entry.topic)} ${entry.message}`;
  if (entry.payload !== undefined) {
    text += ` ${paint(CYAN, entry.payload)}`;
  }
  if (entry.error !== undefined) {
    text += `\n${renderError(entry.error, true)}`;
  }
  return text;
}

// Matches stdout's dev:ino, not mere presence: a terminal from a systemd user unit inherits it.
export function isJournalStream(value: string | undefined, fd: number): boolean {
  const match = /^(\d+):(\d+)$/.exec(value ?? '');
  if (match === null) {
    return false;
  }
  try {
    // bigint: an inode number can exceed what a double holds exactly (it does on Windows).
    const stat = fstatSync(fd, { bigint: true });
    return match[1] === String(stat.dev) && match[2] === String(stat.ino);
  } catch {
    return false;
  }
}

let format: Omit<FormatOptions, 'now'> | undefined;

// journald gets one stream so related lines stay in order; the prefix carries the level.
const defaultSink: LogSink = (entry) => {
  if (format === undefined) {
    const journald = isJournalStream(process.env.JOURNAL_STREAM, 1);
    format = { journald, colors: !journald && process.env.PRANDIUM_DEV === '1' && Bun.enableANSIColors };
  }
  const out = format.journald || entry.level === 'info' ? process.stdout : process.stderr;
  out.write(`${formatEntry(entry, { ...format, now: new Date() })}\n`);
};

let sink: LogSink = defaultSink;

export function setLogSink(next: LogSink): () => void {
  const previous = sink;
  sink = next;
  return () => {
    sink = previous;
  };
}

export const log = {
  info(topic: string, message: string, payload?: string): void {
    sink({ level: 'info', topic, message, payload });
  },
  warn(topic: string, message: string): void {
    sink({ level: 'warn', topic, message });
  },
  error(topic: string, message: string, err?: unknown, payload?: string): void {
    sink({ level: 'error', topic, message, payload, error: err });
  },
};
