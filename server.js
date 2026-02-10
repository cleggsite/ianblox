import { WebSocketServer } from "ws";
import http from "http";

const PORT = process.env.PORT || 8080;

// --- Minimal HTTP server for Render ---
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end("Server alive");
});

server.listen(PORT, () => console.log("HTTP server running on port", PORT));

// --- WebSocket server ---
const wss = new WebSocketServer({ server });

const rooms = {};

wss.on("connection", ws => {
  ws.on("message", raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }
    const { type, data } = msg;

    // --- CREATE ROOM ---
    if (type === "create") {
      const room = data.room;
      const id = data.id;

      if (rooms[room]) {
        ws.send(JSON.stringify({ type: "error", data: "Room already exists" }));
        return;
      }

      ws.id = id;
      ws.room = room;

      rooms[room] = {
        host: id,
        phase: "lobby",
        players: { [id]: { alive: true } }
      };

      ws.send(JSON.stringify({ type: "created", room }));
      broadcast(room);
    }

    // --- JOIN ROOM ---
    if (type === "join") {
      const { room, id } = data;

      if (!rooms[room]) {
        ws.send(JSON.stringify({ type: "error", data: "Room does not exist" }));
        return;
      }

      ws.id = id;
      ws.room = room;

      rooms[room].players[id] = { alive: true };
      broadcast(room);
    }

    // --- START GAME ---
    if (type === "start") {
      const room = rooms[ws.room];
      if (!room) return;

      if (ws.id !== room.host) {
        ws.send(JSON.stringify({ type: "error", data: "Only host can start" }));
        return;
      }

      const ids = Object.keys(room.players);
      if (ids.length < 2) {
        ws.send(JSON.stringify({ type: "error", data: "Need 2+ players" }));
        return;
      }

      const mafia = ids[Math.floor(Math.random() * ids.length)];
      ids.forEach(id => {
        room.players[id].role = id === mafia ? "Mafia" : "Villager";
      });

      room.phase = "day";
      broadcast(ws.room);
    }
  });

  ws.on("close", () => {
    if (!ws.room || !rooms[ws.room]) return;
    delete rooms[ws.room].players[ws.id];
    broadcast(ws.room);
  });
});

function broadcast(roomCode) {
  const payload = JSON.stringify({ type: "update", data: rooms[roomCode] });
  wss.clients.forEach(c => {
    if (c.room === roomCode) c.send(payload);
  });
}

console.log("WebSocket server running on port", PORT);
