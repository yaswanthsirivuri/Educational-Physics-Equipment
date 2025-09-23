from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import uvicorn
from zeroconf import Zeroconf, ServiceInfo
import socket
import threading

app = FastAPI()

clients = []

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)

    try:
        while True:
            data = await websocket.receive_text()
            print(f"Message received from ESP32: {data}")

    except WebSocketDisconnect:
        clients.remove(websocket)
        print("Client disconnected")

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)