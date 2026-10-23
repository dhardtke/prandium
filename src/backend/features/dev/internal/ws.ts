import type { WebSocketHandler } from 'bun';
import { attach, detach } from './hub.ts';

export function devWebSocket(webRoot: string): WebSocketHandler<undefined> {
  return {
    open: (ws) => {
      attach(ws, webRoot);
    },
    close: (ws) => {
      detach(ws);
    },
    message: () => {
      // Required by the type; the browser only listens, it never sends.
    },
  };
}
