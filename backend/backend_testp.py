import websocket
import time

def on_message(ws, message):
    print(f"Received message: {message}")
    pass

def on_error(ws, error):
    print(f"Error: {error}")

def on_close(ws, close_status_code, close_msg):
    print("Connection closed, attempting to reconnect...")
    reconnect(ws)

def on_open(ws):
    print("Connected")

def reconnect(ws):
    ws.run_forever()

ws = websocket.WebSocketApp("ws://esp32.local/ws",
                            on_message=on_message,
                            on_error=on_error,
                            on_close=on_close)
ws.on_open = on_open

# Run the WebSocket connection and automatically reconnect on disconnect
ws.run_forever()
