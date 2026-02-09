import WebSocket, { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

// Track all rooms
const rooms = {};
const createdRooms = {}; // Tracks which rooms were actually created (for join validation)

wss.on("connection", ws => {

  ws.on("message", msg => {
    const { type, data } = JSON.parse(msg);

    // ---------------- CREATE ROOM ----------------
    if (type === "create") {
      const room = data.room;

      if (createdRooms[room]) {
        ws.send(JSON.stringify({ type: "error", data: "Room code collision, try again" }));
        return;
      }

      // Mark this room as created and set host
      createdRooms[room] = ws.id;
      rooms[room] = { players: {}, phase: "lobby", host: ws.id };

      // Send confirmation back to the client
      ws.send(JSON.stringify({ type: "created", room }));
    }

    // ---------------- JOIN ROOM ----------------
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

    // ---------------- START GAME ----------------
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

      // assign 1 random Mafia
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
