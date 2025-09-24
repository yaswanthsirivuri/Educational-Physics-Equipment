// BLE overview: https://devzone.nordicsemi.com/guides/short-range-guides/b/bluetooth-low-energy/posts/ble-characteristics-a-beginners-tutorial
// ESP32 BLE tutorial: https://randomnerdtutorials.com/esp32-bluetooth-low-energy-ble-arduino-ide/

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>
#include <BLE2901.h>

// generating UUIDs: https://www.uuidgenerator.net/
#define SERVICE_UUID 	      "8bac7fbb-9890-4fef-8e2a-05c75fabe512"
#define CHARACTERISTIC_UUID "85af4282-a704-4944-814d-5dc715d6bd67"

const int ledPin = 4;
const int ledPin2 = 2;
const int echoPin = 17;
const int trigPin = 18;

typedef union {
	float f;
	uint32_t u;
	byte b[4];
} binaryFloat;

binaryFloat distance;

bool device_connected_BLE = false;
bool device_connected_BLE_prev = false;

BLEServer *server_BLE = NULL;
BLECharacteristic *characteristic_BLE = NULL;
BLE2901 *descriptor_2901 = NULL;

class ServerCallbacks : public BLEServerCallbacks {
	void onConnect(BLEServer *_server) {
		digitalWrite(ledPin, HIGH);
		device_connected_BLE = true;
	}

	void onDisconnected(BLEServer *_server) {
		digitalWrite(ledPin, LOW);
		device_connected_BLE = false;
	}
};

// SETUP AND LOOP //

void setup() {
	pinMode(ledPin, OUTPUT);
	pinMode(ledPin2, OUTPUT);
	pinMode(trigPin, OUTPUT);
	pinMode(echoPin, INPUT);

	Serial.begin(9600);
	
	initBLE();
}

void loop() {
	readDistance();

	//writeDistanceSerial();
	distance.f = 36;
	processBLE();

	delay(500);
}

// SUB-FUNCTIONS //

void initBLE() {
	BLEDevice::init("ESP32-ultrasonic");

	server_BLE = BLEDevice::createServer();
	server_BLE->setCallbacks(new ServerCallbacks());

	BLEService *service = server_BLE->createService(SERVICE_UUID);

	characteristic_BLE = service->createCharacteristic(
		CHARACTERISTIC_UUID,
		BLECharacteristic::PROPERTY_READ | BLECharacteristic::PROPERTY_WRITE | BLECharacteristic::PROPERTY_NOTIFY | BLECharacteristic::PROPERTY_INDICATE
	);
  // creates BLE Descriptor 0x2902: Client Characteristic Configuration Descriptor (CCCD)
  // descriptor 2902 is not required when using NimBLE as it is automatically added based on the characteristic_BLE properties
	characteristic_BLE->addDescriptor(new BLE2902());
	descriptor_2901 = new BLE2901(); // ddd the Characteristic User Description - 0x2901 descriptor
  descriptor_2901->setDescription("Distance reading (mm).");
  descriptor_2901->setAccessPermissions(ESP_GATT_PERM_READ); // enforce read only - default is Read|Write
  characteristic_BLE->addDescriptor(descriptor_2901);

	service->start();

	BLEAdvertising *advertising = BLEDevice::getAdvertising();
	advertising->addServiceUUID(SERVICE_UUID);
	advertising->setScanResponse(true);
	advertising->setMinPreferred(0x06); // functions that help with iPhone connections issue
	advertising->setMinPreferred(0x12); // tbh I have no idea what this does
	BLEDevice::startAdvertising();

	Serial.println("bluetooth now visible to scanning devices");
}

void processBLE() {
	if (device_connected_BLE) {
		binaryFloat reversed_bits;
		reversed_bits.u = reverse_u32(distance.u);
		characteristic_BLE->setValue(reversed_bits.f); // the float bits are reversed when reading via web-bluetooth javascript api
		// todo check if this also happens via other ble readers
		characteristic_BLE->notify();
	}
  // disconnecting
  if (!device_connected_BLE && device_connected_BLE_prev) {
    delay(500); // give the bluetooth stack the chance to get things ready
    server_BLE->startAdvertising(); // restart advertising
    Serial.println("start BLE advertising");
  }
  device_connected_BLE_prev = device_connected_BLE;
}

uint8_t reverse_u8(uint8_t x) {
	const char * reverse_u4 = "\x0\x8\x4\xC\x2\xA\x6\xE\x1\x9\x5\xD\x3\xB\x7\xF";
	return reverse_u4[x >> 4] | (reverse_u4[x & 0x0F] << 4);
}
uint16_t reverse_u16(uint16_t x) { return reverse_u8(x >> 8)   | (reverse_u8(x & 0xFF) << 8); }
uint32_t reverse_u32(uint32_t x) { return reverse_u16(x >> 16) | (reverse_u16(x & 0xFFFF) << 16); }

void readDistance() {
	digitalWrite(trigPin, LOW);
	delayMicroseconds(2);
	digitalWrite(trigPin, HIGH);
	delayMicroseconds(10);
	digitalWrite(trigPin, LOW);

	float duration = pulseIn(echoPin, HIGH);
	distance.f = (duration * 0.0343) / 2;
}

void writeDistanceSerial() {
	Serial.write(distance.b[3]);
	Serial.write(distance.b[2]);
	Serial.write(distance.b[1]);
	Serial.write(distance.b[0]);

	Serial.write(255);
	Serial.write(255);
	Serial.write(255);
	Serial.write(255);
}
