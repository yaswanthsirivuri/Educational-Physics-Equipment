#include <WiFi.h>
#include <ESPmDNS.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <ArduinoWebsockets.h>

const char* ssid = "ESP32";  // AP network name
const char* password = "";    // password
const int ldrPin = 34;        // LDR ADC pin

const char* serverIP = "esp32-backend.local";
const int serverPort = 8000;
const char* wsUri = "/ws";

// AsyncWebServer server(80);    // HTTP server on port 80
// AsyncWebSocket ws("/ws");     // WebSocket handler

using namespace websockets; 
WebsocketsClient client;

// Static IP configuration for SoftAP
IPAddress local_IP(192, 168, 4, 1);  // Fixed IP address for ESP32 in AP mode
IPAddress gateway(192, 168, 4, 1);   // Gateway is the same as the local IP
IPAddress subnet(255, 255, 255, 0);  // Subnet mask

void connectToWebSocketServer(){
  String wsUrl = String("ws://") + serverIP + ":" + String(serverPort) + wsUri;   // String wsUrl = String("ws://esp32-backend.local:8000/ws");
  while (!client.connect(wsUrl)) {   // Connect to WebSocket server
    Serial.println("Trying to connect to WebSocket server!");
    delay(1000);
  }
  Serial.println("Connected to WebSocket server!");
}

void onMessageCallBack(WebsocketsMessage msg){
  Serial.println("Mesasge received: " + msg.data());
} 

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

  // websocket config
  client.onMessage(onMessageCallBack);
  connectToWebSocketServer();

  // server.addHandler(&ws);
  // server.begin();   // Start HTTP server (optional, just for general HTTP routes)
}

void loop() {
  if (client.available()) {
    client.poll();  // Keep the WebSocket connection alive
  } else {
    connectToWebSocketServer();  
  }

  int ldrValue = analogRead(ldrPin);  
  String message = String(ldrValue);

  Serial.println(message);
  client.send(message);
  
  delay(1000); 
}
