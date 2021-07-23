import { serve } from "https://deno.land/std@0.102.0/http/server.ts";
import { acceptWebSocket, isWebSocketCloseEvent, WebSocket, } from "https://deno.land/std@0.102.0/ws/mod.ts";

// TODO: load from deps.ts

const sockets: WebSocket[] = [];

function removeSocket(sock: WebSocket) {
  sockets.splice(sockets.indexOf(sock), 1);
}

async function handleWs(sock: WebSocket) {
  sockets.push(sock);
  try {
    for await (const ev of sock) {
      if (isWebSocketCloseEvent(ev)) {
        removeSocket(sock);
      }
    }
  } catch (err) {
    console.error(`failed to receive frame: ${err}`);

    if (!sock.isClosed) {
      await sock.close(1000).then(() => removeSocket(sock)).catch(console.error);
    }
  }
}

self.onmessage = function () {
  sockets.forEach(sock => {
    sock.send("reload");
  });
};

// TODO configure port
for await (const req of serve(`127.0.0.1:8080`)) {
  const { conn, r: bufReader, w: bufWriter, headers } = req;
  acceptWebSocket({
    conn,
    bufReader,
    bufWriter,
    headers,
  })
    .then(handleWs)
    .catch(async (err) => {
      console.error(`failed to accept websocket: ${err}`);
      await req.respond({ status: 400 });
    });
}
