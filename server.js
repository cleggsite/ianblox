import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });
const rooms = {};

wss.on("connection", ws => {
  ws.on("message", msg => {
    const { type, data } = JSON.parse(msg);

    if (type === "join") {
      const { room, id } = data;
      ws.id = id;
      ws.room = room;

      // create room if it doesn't exist
      rooms[room] ??= { players: {}, phase: "lobby" };
      rooms[room].players[id] = { alive: true };

      broadcast(room);
    }

    if (type === "start") {
      const room = rooms[ws.room];
      const ids = Object.keys(room?.players ?? {});

      if (!room) return;
      if (ids.length < 2) {
        ws.send(JSON.stringify({ type: "error", data: "Need at least 2 players to start" }));
        return;
      }

      // assign 1 random Mafia
      const mafiaIndex = Math.floor(Math.random() * ids.length);
      ids.forEach((id, index) => {
        room.players[id].role = index === mafiaIndex ? "Mafia" : "Villager";
      });

      room.phase = "day";
      broadcast(ws.room);
    }
  });
});

function broadcast(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  const payload = JSON.stringify({
    type: "update",
    data: room
  });

  wss.clients.forEach(c => {
    if (c.room === roomCode) c.send(payload);
  });
}

console.log("Server running on port 8080");
