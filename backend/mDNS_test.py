from fastapi import FastAPI
import uvicorn
from zeroconf import Zeroconf, ServiceInfo
import socket
import atexit

app = FastAPI()

# ========== mDNS Setup ==========
hostname = "mydevice.local."
service_type = "_http._tcp.local."
service_name = "My Python Web Server._http._tcp.local."
port = 8000

ip = socket.gethostbyname(socket.gethostname())
ip_bytes = socket.inet_aton(ip)

info = ServiceInfo(
    type_=service_type,
    name=service_name,
    port=port,
    addresses=[ip_bytes],
    properties={},
    server=hostname,
)

zeroconf = Zeroconf()
zeroconf.register_service(info)
print(f"[mDNS] Registered: {service_name} at {hostname} ({ip}:{port})")

# Ensure service is unregistered on exit
def cleanup():
    print("\n[mDNS] Shutting down responder...")
    zeroconf.unregister_service(info)
    zeroconf.close()

atexit.register(cleanup)

# ========== FastAPI Routes ==========
@app.get("/hello")
async def hello():
    return {"message": "Hello from FastAPI via mDNS!"}

# ========== Start FastAPI ==========
if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=port, reload=False)
