from fastapi import FastAPI, HTTPException, WebSocket
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
import asyncio
import json

app = FastAPI(title="ESP32 Light Sensor API")

# Pydantic model for data validation
class SensorData(BaseModel):
    ldr_value: int
    voltage: float

# Queue for processing incoming data
data_queue = asyncio.Queue()
# Store latest data and WebSocket clients
latest_data = {"ldr_value": 0, "voltage": 0.0}
websocket_clients = set()

# Background task to process queue and print data
async def process_queue():
    while True:
        try:
            data = await data_queue.get()
            print(f"Received: LDR Value = {data['ldr_value']}, Voltage = {data['voltage']} V")
            data_queue.task_done()
            # Broadcast to WebSocket clients
            if websocket_clients:
                message = json.dumps({"ldr_value": data["ldr_value"], "voltage": data["voltage"]})
                disconnected_clients = []
                for client in websocket_clients:
                    try:
                        await client.send_text(message)
                    except Exception:
                        disconnected_clients.append(client)
                for client in disconnected_clients:
                    websocket_clients.discard(client)
        except Exception as e:
            print(f"Queue processing error: {str(e)}")

# Start queue processing on app startup
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(process_queue())

@app.post("/data")
async def receive_data(data: SensorData):
    try:
        # Add data to queue
        await data_queue.put({"ldr_value": data.ldr_value, "voltage": data.voltage})
        latest_data["ldr_value"] = data.ldr_value
        latest_data["voltage"] = data.voltage
        return {"success": True}
    except Exception as e:
        print(f"Error: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/", response_class=HTMLResponse)
async def show_data():
    html_content = """
    <html>
        <head>
            <title>ESP32 Light Sensor</title>
            <style>
                body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
                h1 { color: #333; }
                .data { font-size: 24px; margin: 20px; }
                .status { color: green; }
                .error { color: red; }
            </style>
        </head>
        <body>
            <h1>ESP32 Light Sensor Data</h1>
            <div class="data">LDR Value: <span id="ldr_value">0</span></div>
            <div class="data">Voltage: <span id="voltage">0.00</span> V</div>
            <div id="status" class="status">Connecting to WebSocket...</div>
            <script>
                function connectWebSocket() {
                    const ws = new WebSocket(`ws://${window.location.host}/ws`);
                    ws.onmessage = function(event) {
                        const data = JSON.parse(event.data);
                        document.getElementById('ldr_value').textContent = data.ldr_value;
                        document.getElementById('voltage').textContent = data.voltage.toFixed(2);
                        document.getElementById('status').textContent = 'Connected';
                        document.getElementById('status').className = 'status';
                    };
                    ws.onclose = function() {
                        document.getElementById('status').textContent = 'Disconnected. Reconnecting...';
                        document.getElementById('status').className = 'error';
                        setTimeout(connectWebSocket, 1000);
                    };
                    ws.onerror = function(error) {
                        console.error('WebSocket error:', error);
                        document.getElementById('status').textContent = 'WebSocket Error';
                        document.getElementById('status').className = 'error';
                    };
                }
                connectWebSocket();
            </script>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    websocket_clients.add(websocket)
    try:
        while True:
            await websocket.receive_text()  # Keep connection alive
    except Exception:
        websocket_clients.discard(websocket)


#start server 
#uvicorn test_server_delete:app --host 0.0.0.0 --port 5000 --reload

