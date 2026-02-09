import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });
const rooms = {};

function send(ws, type, data) {
  ws.send(JSON.stringify({ type, data }));
}

wss.on("connection", ws => {
  ws.on("message", msg => {
    const { type, data } = JSON.parse(msg);

    if (type === "join") {
      const { room, id } = data;
      ws.id = id;
      ws.room = room;

      rooms[room] ??= { players: {}, phase: "lobby" };
      rooms[room].players[id] = { alive: true };

      broadcast(room);
    }

    if (type === "start") {
      const room = rooms[ws.room];
      const ids = Object.keys(room.players);
      const mafia = ids[Math.floor(Math.random() * ids.length)];

      ids.forEach(id => {
        room.players[id].role = id === mafia ? "Mafia" : "Villager";
      });

      room.phase = "day";
      broadcast(ws.room);
    }
  });
});

function broadcast(roomCode) {
  const payload = JSON.stringify({
    type: "update",
    data: rooms[roomCode]
  });

  wss.clients.forEach(c => {
    if (c.room === roomCode) c.send(payload);
  });
}

console.log("Server running on port 8080");
