const WebSocket = require("ws");

const clients = new Map();

function setupWebSocket(server) {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    console.log("Cliente conectado al WebSocket");

    ws.on("message", (message) => {
      const { fileId } = JSON.parse(message);
      clients.set(fileId, ws);
    });

    ws.on("close", () => {
      console.log("Cliente desconectado del WebSocket");
    });
  });
}

function sendProgress(fileId, progress) {
  const ws = clients.get(fileId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    console.log(`Enviando progreso: ${progress}% para fileId: ${fileId}`);
    ws.send(JSON.stringify({ fileId, progress }));
  } else {
    console.log(
      `No se pudo enviar progreso: WebSocket cerrado o inexistente para fileId: ${fileId}`
    );
  }
}

module.exports = { setupWebSocket, sendProgress };
