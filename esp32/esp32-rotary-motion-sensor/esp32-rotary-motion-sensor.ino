#include <Arduino.h>
#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <BLESecurity.h>
#include <math.h>

#define PIN_A 25
#define PIN_B 26

BLEServer *pServer = nullptr;
BLECharacteristic *pCharacteristic = nullptr;

long encoderCount = 0;
uint8_t old_AB = 0;
int pollTriggers = 0;

#define SERVICE_UUID        "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
#define CHARACTERISTIC_UUID "6e400002-b5a3-f393-e0a9-e50e24dcca9e"

static const int8_t enc_delta[] = {0, -1, 1, 0, 1, 0, 0, -1, -1, 0, 0, 1, 0, 1, -1, 0};

class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) {
    Serial.println("*** Device Connected ***");
  }
  void onDisconnect(BLEServer* pServer) {
    Serial.println("*** device disconnected - restarting advertising ***");
    pServer->startAdvertising();
    Serial.println("BLE advertising restarted after disconnect");
  }
};

void setup() {
  Serial.begin(115200);
  for (int i = 0; i < 10 && !Serial; i++) {
    delay(100);
    Serial.println("waiting for sserial...");
  }
  Serial.println("start setup");
  
  Serial.println("initializing ble...");
  BLEDevice::init("ESP32 Rotary Motion Sensor");
  //BLEDevice::setEncryptionLevel(ESP_BLE_SEC_ENCRYPT);
  //BLESecurity *pSecurity = new BLESecurity();
  //pSecurity->setAuthenticationMode(ESP_LE_AUTH_BOND);
  
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());
  Serial.println("BLE server created");
  
  BLEService *pService = pServer->createService(SERVICE_UUID);
  Serial.println("BLE service created");
  
  pCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID,
    BLECharacteristic::PROPERTY_NOTIFY
  );
  pCharacteristic->addDescriptor(new BLE2902());
  Serial.println("BLE characteristic created");
  
  pService->start();
  Serial.println("BLE service started");
  
  BLEAdvertising *pAdvertising = pServer->getAdvertising();
  pAdvertising->addServiceUUID(SERVICE_UUID);
  pAdvertising->setScanResponse(true);
  pAdvertising->setMinPreferred(0x06);
  pAdvertising->setMinInterval(0x20);
  pAdvertising->setMaxInterval(0x40);
  pAdvertising->start();
  Serial.println("BLE advertising started, waiting for connection");
  Serial.println("device address: " + String(BLEDevice::getAddress().toString().c_str()));
  Serial.println("complete");
  
  pinMode(PIN_A, INPUT_PULLUP);
  pinMode(PIN_B, INPUT_PULLUP);
  old_AB = (digitalRead(PIN_A) << 1) | digitalRead(PIN_B);
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

  static unsigned long lastNotify = 0;
  if (millis() - lastNotify >= 50) {
    lastNotify = millis();
    float angle = (float)encoderCount * (2 * M_PI / 2400.0);
    String data = "{\"angle\":" + String(angle, 2) + ",\"count\":" + String(encoderCount) + "}";
    pCharacteristic->setValue(data.c_str());
    pCharacteristic->notify();
    Serial.println("Sent: " + data);
  }
}