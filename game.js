const WS_URL = "wss://ianblox.onrender.com"; // your Render server
const ws = new WebSocket(WS_URL);

const playerId = Math.random().toString(36).slice(2);
let roomCode = "";
let isHost = false;

ws.onopen = () => console.log("Connected to server");

ws.onmessage = e => {
  const msg = JSON.parse(e.data);
  if (msg.type === "update") updateGame(msg.data);
};

// ---------------- CREATE / JOIN ROOM ----------------
function createRoom() {
  // Generate random code and show it
  roomCode = Math.random().toString(36).slice(2, 7).toUpperCase();
  isHost = true;

  document.getElementById("newRoomCode").innerText =
    "Room Code: " + roomCode + " (share this with friends)";
}

function joinRoom() {
  roomCode = document.getElementById("roomInput").value.trim().toUpperCase();
  if (!roomCode) return alert("Enter a room code");

  // If you just created the room, isHost stays true
  if (!isHost) isHost = false;

  ws.send(JSON.stringify({
    type: "join",
    data: { room: roomCode, id: playerId }
  }));

  showGameUI();
}

function showGameUI() {
  document.getElementById("menu").hidden = true;
  document.getElementById("game").hidden = false;

  document.getElementById("roomInfo").innerText = "Room Code: " + roomCode;
  document.getElementById("hostInfo").innerText = isHost ? "You are the host" : "";
  document.getElementById("startBtn").hidden = !isHost;
  document.getElementById("waiting").innerText = "Waiting for players...";
}

// ---------------- START GAME ----------------
function startGame() {
  ws.send(JSON.stringify({ type: "start" }));
}

// ---------------- UPDATE GAME ----------------
function updateGame(data) {
  document.getElementById("phase").innerText = "Phase: " + data.phase;

  const me = data.players[playerId];
  document.getElementById("role").innerText = "Role: " + (me?.role ?? "Unknown");

  const list = document.getElementById("players");
  list.innerHTML = "";
  Object.keys(data.players).forEach(id => {
    const li = document.createElement("li");
    li.innerText = id === playerId ? "You" : "Player";
    list.appendChild(li);
  });

  // Waiting message
  const count = Object.keys(data.players).length;
  if (data.phase === "lobby") {
    document.getElementById("waiting").innerText = `Waiting for players... (${count})`;
  } else {
    document.getElementById("waiting").innerText = "";
  }
}
