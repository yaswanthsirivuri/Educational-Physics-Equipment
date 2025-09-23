import asyncio
import websockets

async def websocket_client():
    uri = "ws://esp32-backend.local:8000/ws"  # Replace with your FastAPI WebSocket server URI
    async with websockets.connect(uri) as websocket:
        # Send a message to the server
        await websocket.send("Hello from the client!")
        
        # Receive a message from the server
        response = await websocket.recv()
        print(f"Received from server: {response}")

if __name__ == "__main__":
    asyncio.run(websocket_client())