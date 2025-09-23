from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import uvicorn
from zeroconf import Zeroconf, ServiceInfo
import socket
import threading

from register_mdns_service import register_mdns_service

app = FastAPI()

# clients = []

# @app.websocket("/ws")
# async def websocket_endpoint(websocket: WebSocket):
#     await websocket.accept()
#     clients.append(websocket)

#     try:
#         while True:
#             data = await websocket.receive_text()
#             print(f"Message received from ESP32: {data}")

#     except WebSocketDisconnect:
#         clients.remove(websocket)
#         print("Client disconnected")

# ========== FastAPI Routes ==========
@app.get("/hello")
async def hello():
    return {"message": "Hello from FastAPI via mDNS!"}

if __name__ == "__main__":

    zeroconf_instance, service_info = register_mdns_service(
        service_name="backend server._http._tcp.local.",
        service_type="_http._tcp.local.",
        port=8000
    )

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)