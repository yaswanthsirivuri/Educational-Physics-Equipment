#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "x";      // Replace with your WiFi SSID
const char* password = "x";  // Replace with your WiFi password
const char* serverUrl = "http://192.168.1.66:5000/data";  // Replace with your PC's IP, e.g., "http://192.168.1.100:5000/data"
const int ldrPin = 34;                        // LDR ADC pin

void setup() {
  Serial.begin(115200);
  pinMode(ldrPin, INPUT);
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("Connected! IP address: ");
  Serial.println(WiFi.localIP());
}

void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    int ldrValue = analogRead(ldrPin);
    float voltage = (ldrValue / 4095.0) * 3.3;
    char jsonString[64];
    snprintf(jsonString, sizeof(jsonString), "{\"ldr_value\":%d,\"voltage\":%.2f}", ldrValue, voltage);
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    int httpResponseCode = http.POST(jsonString);
    if (httpResponseCode > 0) {
      Serial.printf("HTTP Response: %d\n", httpResponseCode);
      String response = http.getString();
      Serial.println("Response: " + response);
    } else {
      Serial.printf("Error: %d\n", httpResponseCode);
    }
    http.end();
  } else {
    Serial.println("WiFi disconnected");
    WiFi.reconnect();
  }
  delay(100);  // Send every 0.5 seconds
}
