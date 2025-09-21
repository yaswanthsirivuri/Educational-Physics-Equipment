#include <WiFi.h>
#include <ESPmDNS.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>

const char* ssid = "ESP32";  // AP network name
const char* password = "";    // No password
const int ldrPin = 34;        // LDR ADC pin

AsyncWebServer server(80);    // HTTP server on port 80
AsyncWebSocket ws("/ws");     // WebSocket handler

// Static IP configuration for SoftAP
IPAddress local_IP(192, 168, 4, 1);  // Fixed IP address for ESP32 in AP mode
IPAddress gateway(192, 168, 4, 1);   // Gateway is the same as the local IP
IPAddress subnet(255, 255, 255, 0);  // Subnet mask

void setup() {
  Serial.begin(115200);
  pinMode(ldrPin, INPUT);  // Set LDR pin as input

  // Set static IP for SoftAP mode
  WiFi.softAPConfig(local_IP, gateway, subnet);

  // Start SoftAP mode with the specified SSID and no password
  WiFi.softAP(ssid, password);
  Serial.print("AP Started. IP address: ");
  Serial.println(WiFi.softAPIP());  // Should print 192.168.4.1

  // Setup mDNS for easier access (e.g., esp32.local)
  if (MDNS.begin("esp32")) {
    Serial.println("mDNS started: esp32.local");
  } else {
    Serial.println("Error starting mDNS");
  }

  // Handle WebSocket events (on connect, disconnect)
  ws.onEvent(onWsEvent);  // Make sure the function signature matches the expected one
  server.addHandler(&ws);

  // Start HTTP server (optional, just for general HTTP routes)
  server.begin();
}

void loop() {
  // Send sensor data (LDR reading) via WebSocket
  int ldrValue = analogRead(ldrPin);
  String message = String(ldrValue);
  
  ws.textAll(message);  // Send LDR data to all connected WebSocket clients
  delay(500); 
}

void onWsEvent(AsyncWebSocket * server, AsyncWebSocketClient * client, AwsEventType type, void * arg, uint8_t *data, size_t len){
  if(type == WS_EVT_CONNECT){
    Serial.println("Websocket client connection received");
  } else if(type == WS_EVT_DISCONNECT){
    Serial.println("Client disconnected");
  }
}
