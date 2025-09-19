#include <Arduino.h>
#include <BluetoothSerial.h>
#include <math.h>

#define PIN_A 25  // Green wire (Channel A)
#define PIN_B 26  // White wire (Channel B)

BluetoothSerial SerialBT;

long encoderCount = 0;
uint8_t old_AB = 0;
int pollTriggers = 0;

static const int8_t enc_delta[] = {0, -1, 1, 0, 1, 0, 0, -1, -1, 0, 0, 1, 0, 1, -1, 0};

void setup() {
  Serial.begin(115200);
  while (!Serial) { delay(10); }

  // Initialize Bluetooth
  SerialBT.begin("ESP32 Rotary Motion Sensor V2");  // Bluetooth device name
  Serial.println("Bluetooth started: ESP32 Rotary Motion Sensor V2");
  Serial.println("Connect via Bluetooth Serial app on your phone (115200 baud)");

  pinMode(PIN_A, INPUT_PULLUP);  // Internal 3.3V pull-up for NPN
  pinMode(PIN_B, INPUT_PULLUP);

  old_AB = (digitalRead(PIN_A) << 1) | digitalRead(PIN_B);
  Serial.print("Initial A (green): ");
  Serial.print(digitalRead(PIN_A));
  Serial.print(", B (white): ");
  Serial.println(digitalRead(PIN_B));
  Serial.println("Direct connection, polling mode, continuous angles for Bluetooth.");
}

void loop() {
  uint8_t current_AB = (digitalRead(PIN_A) << 1) | digitalRead(PIN_B);
  if (current_AB != old_AB) {
    pollTriggers++;
    old_AB <<= 2;
    old_AB |= current_AB;
    encoderCount += enc_delta[old_AB & 0x0F];
    old_AB = current_AB;
  }

  static unsigned long lastPrint = 0;
  if (millis() - lastPrint >= 50) {
    lastPrint = millis();

    // Calculate angle
    float angle = (float)encoderCount * (360.0 / 2400.0);  // 600 PPR x 4 = 2400 counts/rev

    // Bluetooth output for phone
    SerialBT.print("Angle: ");
    SerialBT.print(angle, 2);  // 2 decimal places
    SerialBT.println(" degrees");

    // Diagnostics for Serial Monitor (USB)
    Serial.print("A: ");
    Serial.print(digitalRead(PIN_A));
    Serial.print(", B: ");
    Serial.print(digitalRead(PIN_B));
    Serial.print(", Changes: ");
    Serial.print(pollTriggers);
    Serial.print(", Count: ");
    Serial.println(encoderCount);
    Serial.print("Angle: ");
    Serial.print(angle);
    Serial.println(" degrees");
  }
}