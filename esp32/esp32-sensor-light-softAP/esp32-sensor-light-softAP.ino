/*
  ESP32 lightsensor works on softAP network broadcast data through websocket connection
*/

#include <WiFi.h>  
#include <ESPAsyncWebServer.h>
#include <AsyncTCP.h>
#include <ESPmDNS.h>

const char* ssid = "ESP32";
const char* password = "";

const int ldrPin = 34;

AsyncWebServer server(80);         // Web server on port 80
AsyncWebSocket ws("/ws");          // WebSocket endpoint at /ws

// Static IP config for AP mode
IPAddress local_IP(192, 168, 4, 1);
IPAddress gateway(192, 168, 4, 1);
IPAddress subnet(255, 255, 255, 0);

// WebSocket event handler
void onWsEvent(AsyncWebSocket * server, AsyncWebSocketClient * client,
               AwsEventType type, void * arg, uint8_t *data, size_t len) {
  if (type == WS_EVT_CONNECT) {
    Serial.println("Client connected");
    client->text("Welcome to ESP32 WebSocket!");
  } 
  else if (type == WS_EVT_DISCONNECT) {
    Serial.println("Client disconnected");
  } 
  else if (type == WS_EVT_DATA) {
    String msg = "";
    for (size_t i = 0; i < len; i++) {
      msg += (char)data[i];
    }
    Serial.println("Received: " + msg);
    // client->text("Echo: " + msg);
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(ldrPin, INPUT);

  // Configure AP mode with static IP
  WiFi.softAPConfig(local_IP, gateway, subnet);
  WiFi.softAP(ssid, password); 

  Serial.print("ESP32 AP IP address: ");
  Serial.println(WiFi.softAPIP());  

  if (MDNS.begin("esp32")) {
    Serial.println("ESP32 mDNS started: esp32.local");
  } else {
    Serial.println("Error starting mDNS");
  }

  ws.onEvent(onWsEvent); //config ws handler
  server.addHandler(&ws); //add handler to server
  
  server.begin();
}

void loop() {
  int ldrValue = analogRead(ldrPin);
  String msg = String(ldrValue);

  ws.textAll(msg);  
  Serial.println("Broadcast: " + msg);
  delay(1000);
}
