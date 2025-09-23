#include <WiFi.h>
#include <ESPmDNS.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoWebsockets.h>

const char* ssid = "ESP32";  // AP network name
const char* password = "";    // No password
const int ldrPin = 34;        // LDR ADC pin

const char* serverIP = "esp32-backend.local";
const int serverPort = 8000;
const char* wsUri = "/ws";

using namespace websockets; //WebsocketsClient class

AsyncWebServer server(80);    // HTTP server on port 80
AsyncWebSocket ws("/ws");     // WebSocket handler
WebsocketsClient client;

// Static IP configuration for SoftAP
IPAddress local_IP(192, 168, 4, 1);  // Fixed IP address for ESP32 in AP mode
IPAddress gateway(192, 168, 4, 1);   // Gateway is the same as the local IP
IPAddress subnet(255, 255, 255, 0);  // Subnet mask

void setup() {
  Serial.begin(115200);
  pinMode(ldrPin, INPUT);  // Set LDR pin as input

  WiFi.softAPConfig(local_IP, gateway, subnet);   // Config softAP
  WiFi.softAP(ssid, password);
  Serial.print("AP Started. IP address: ");
  Serial.println(WiFi.softAPIP());  // Should print 192.168.4.1

  while (!MDNS.begin("esp32")) { //Set up mDNS
    Serial.println("Error starting mDNS. Retrying...");
    delay(1000);
  }

  String wsUrl = String("ws://") + serverIP + ":" + String(serverPort) + wsUri;
  // String wsUrl = String("ws://esp32-backend.local:8000/ws");
  while (!client.connect(wsUrl)) {   // Connect to WebSocket server
    Serial.println("Trying to connect to WebSocket server!");
    delay(1000);
  }
  Serial.println("Connected to WebSocket server!");


  // Handle WebSocket events (on connect, disconnect)
  // ws.onEvent(onWsEvent);  // Make sure the function signature matches the expected one
 
  server.addHandler(&ws);
  server.begin();   // Start HTTP server (optional, just for general HTTP routes)
}

void loop() {
  client.poll(); // keep connection alive

  int ldrValue = analogRead(ldrPin);   // Send sensor data (LDR reading)
  String message = String(ldrValue);

  Serial.println(message);
  client.send(message);
  // MDNS.update(); // mDNS will automatically handle DNS resolution once started
  
  // ws.textAll(message);  // Send LDR data to all connected WebSocket clients
  delay(1); 
}

// void onWsEvent(AsyncWebSocket * server, AsyncWebSocketClient * client, AwsEventType type, void * arg, uint8_t *data, size_t len) {
//   if (type == WS_EVT_CONNECT) {
//     Serial.println("WebSocket client connected!");
//   } else if (type == WS_EVT_DISCONNECT) {
//     Serial.println("WebSocket client disconnected!");
//   } else if (type == WS_EVT_DATA) {
//     // Optionally, handle data received from WebSocket server
//     String receivedMessage = String((char*)data);
//     Serial.println("Received message: " + receivedMessage);
//   }
// }
