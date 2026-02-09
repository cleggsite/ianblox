import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });
const rooms = {};      // Stores all rooms
const createdRooms = {}; // Tracks rooms created with "Create Room"

wss.on("connection", ws => {
  ws.on("message", msg => {
    const { type, data } = JSON.parse(msg);

    if (type === "create") {
      // Player creates a new room
      const room = data.room;
      createdRooms[room] = ws.id; // store host id
      rooms[room] = { players: {}, phase: "lobby", host: ws.id };
      ws.send(JSON.stringify({ type: "created", room }));
    }

    if (type === "join") {
      const { room, id } = data;
      ws.id = id;
      ws.room = room;

      if (!createdRooms[room]) {
        ws.send(JSON.stringify({ type: "error", data: "Room does not exist" }));
        return;
      }

      rooms[room].players[id] = { alive: true };
      broadcast(room);
    }

    if (type === "start") {
      const room = rooms[ws.room];
      if (!room) return;

      const ids = Object.keys(room.players);

      if (ws.id !== room.host) {
        ws.send(JSON.stringify({ type: "error", data: "Only the host can start the game" }));
        return;
      }

      if (ids.length < 2) {
        ws.send(JSON.stringify({ type: "error", data: "Need at least 2 players to start" }));
        return;
      }

      // assign 1 Mafia
      const mafiaIndex = Math.floor(Math.random() * ids.length);
      ids.forEach((id, i) => {
        room.players[id].role = i === mafiaIndex ? "Mafia" : "Villager";
      });

      room.phase = "day";
      broadcast(ws.room);
    }
  });
});

function broadcast(roomCode) {
  const room = rooms[roomCode];
  if (!room) return;

  const payload = JSON.stringify({ type: "update", data: room });

  wss.clients.forEach(c => {
    if (c.room === roomCode) c.send(payload);
  });
}

console.log("Server running on port 8080");
