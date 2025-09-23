from fastapi import FastAPI, WebSocket, WebSocketDisconnect
import uvicorn
from zeroconf import Zeroconf, ServiceInfo
import socket
import threading

from register_mdns_service import register_mdns_service

app = FastAPI()

@app.get("/hello")
async def hello():
    return {"message": "Hello from FastAPI via mDNS!"}

if __name__ == "__main__":
    zeroconf_instance, service_info = register_mdns_service(
        service_name="backend server._http._tcp.local.",
        service_type="_http._tcp.local.",
        port=8000,
        hostname="esp32.local.",
    )

    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)