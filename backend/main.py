from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import uvicorn
from zeroconf import Zeroconf, ServiceInfo
import socket
import threading
import logging
from register_mdns_service import register_mdns_service
import time

app = FastAPI()

clients = []
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    clients.append(websocket)
    print(f"Client connected: {websocket.client}")

    try:
        while True:
            data = await websocket.receive_text()
            print(f"Received message: {data}")
            await websocket.send_text("received: {data}")

    except WebSocketDisconnect:
        clients.remove(websocket)
        print(f"Client disconnected: {websocket.client}")

@app.get("/hello")
async def hello():
    return {"message": "Hello from FastAPI via mDNS!"}

if __name__ == "__main__":
    # logging.basicConfig(
    #     level=logging.DEBUG,  # Set the root logger level to DEBUG
    #     format="%(asctime)s - %(levelname)s - %(message)s"
    # )

    zeroconf_instance, service_info = register_mdns_service(
        service_name="backend server._http._tcp.local.",
        service_type="_http._tcp.local.",
        port=8000,
        hostname="esp32-backend.local.",
    )

    uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
    # uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="debug")