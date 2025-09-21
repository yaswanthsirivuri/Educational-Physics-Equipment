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

  // Serve webpage at /
  server.on("/", HTTP_GET, [](AsyncWebServerRequest *request) {
    String html = R"rawliteral(
    <html>
      <head>
        <title>ESP32 LDR Sensor</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; margin-top: 50px; }
          h1 { color: #333; }
          .data { font-size: 24px; margin: 20px; }
          .status { color: green; }
          .error { color: red; }
        </style>
      </head>
      <body>
        <h1>ESP32 LDR Sensor</h1>
        <div class="data">LDR Value: <span id="ldr_value">0</span></div>
        <div class="data">Voltage: <span id="voltage">0.00</span> V</div>
        <div id="status" class="status">Loading...</div>
        <script>
          function updateData() {
            fetch('/data')
              .then(response => response.json())
              .then(data => {
                document.getElementById('ldr_value').textContent = data.ldr_value;
                document.getElementById('voltage').textContent = data.voltage.toFixed(2);
                document.getElementById('status').textContent = 'Connected';
                document.getElementById('status').className = 'status';
              })
              .catch(error => {
                document.getElementById('status').textContent = 'Error: ' + error;
                document.getElementById('status').className = 'error';
              });
          }
          setInterval(updateData, 1); // Update every 100ms
          updateData(); // Initial call
        </script>
      </body>
    </html>
    )rawliteral";
    request->send(200, "text/html", html);
  });

  // Serve LDR data at /data (GET)
  server.on("/data", HTTP_GET, [](AsyncWebServerRequest *request) {
    int ldrValue = analogRead(ldrPin);
    float voltage = (ldrValue / 4095.0) * 3.3;

    Serial.printf("Serving: LDR Value = %d, Voltage = %.2f V\n", ldrValue, voltage);
    String json = "{\"ldr_value\":" + String(ldrValue) + ",\"voltage\":" + String(voltage, 2) + "}";
    request->send(200, "application/json", json);
  });

  // Start server
  server.begin();
  Serial.println("HTTP server started");
}

void loop() {
}