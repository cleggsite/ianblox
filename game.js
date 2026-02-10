const WS_URL = "wss://ianblox.onrender.com";
const ws = new WebSocket(WS_URL);

const playerId = crypto.randomUUID();
let roomCode = "";
let isHost = false;

ws.onmessage = e => {
  const msg = JSON.parse(e.data);

  if (msg.type === "created") {
    roomCode = msg.room;
    isHost = true;

    document.getElementById("newRoomCode").innerText =
      "Room Code: " + roomCode;

    enterGame();
  }

  if (msg.type === "update") updateGame(msg.data);
  if (msg.type === "error") alert(msg.data);
};

// ---------- CREATE ----------
function createRoom() {
  const code = Math.random().toString(36)
    .slice(2, 7)
    .toUpperCase();

  ws.send(JSON.stringify({
    type: "create",
    data: { room: code, id: playerId }
  }));
}

// ---------- JOIN ----------
function joinRoom() {
  const code = document.getElementById("roomInput")
    .value.trim()
    .toUpperCase();

  if (!code) return alert("Enter a code");

  roomCode = code;
  isHost = false;

  ws.send(JSON.stringify({
    type: "join",
    data: { room: code, id: playerId }
  }));

  enterGame();
}

// ---------- UI ----------
function enterGame() {
  document.getElementById("menu").hidden = true;
  document.getElementById("game").hidden = false;

  document.getElementById("roomInfo").innerText =
    "Room: " + roomCode;

  document.getElementById("startBtn").hidden = !isHost;
}

// ---------- START ----------
function startGame() {
  ws.send(JSON.stringify({ type: "start" }));
}

// ---------- UPDATE ----------
function updateGame(data) {
  document.getElementById("phase").innerText =
    "Phase: " + data.phase;

  const me = data.players[playerId];
  document.getElementById("role").innerText =
    "Role: " + (me?.role ?? "Unknown");

  const list = document.getElementById("players");
  list.innerHTML = "";

  Object.keys(data.players).forEach(id => {
    const li = document.createElement("li");
    li.innerText = id === playerId ? "You" : "Player";
    list.appendChild(li);
  });
}
