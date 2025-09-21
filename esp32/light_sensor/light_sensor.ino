#include <WiFi.h>
#include <AsyncTCP.h>
#include <ESPAsyncWebServer.h>
#include <ESPmDNS.h>

const char* ssid = "ESP32";           // AP network name
const char* password = "";            // No password
const int ldrPin = 34;                // LDR ADC pin

AsyncWebServer server(80);            // HTTP server on port 80


void setup() {
  Serial.begin(115200);
  pinMode(ldrPin, INPUT);

  // Set static IP for AP
  IPAddress local_IP(192, 168, 4, 1);
  IPAddress gateway(192, 168, 4, 1);
  IPAddress subnet(255, 255, 255, 0);
  WiFi.softAPConfig(local_IP, gateway, subnet);

  // Start AP
  WiFi.softAP(ssid, password);
  Serial.print("AP Started. IP address: ");
  Serial.println(WiFi.softAPIP());  // Should be 192.168.4.1

  // Set up mDNS
  if (MDNS.begin("esp32")) {
    Serial.println("mDNS started: esp32.local");
  }
}

void loop() {
}