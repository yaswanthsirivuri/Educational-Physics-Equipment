const int trigPin = 2;
const int echoPin = 16;

// used to access the bytes in a float so they can be sent over seial
typedef union {
	float f;
	byte b[4];
} binaryFloat;

float duration;
binaryFloat distance;

void setup() {
	pinMode(trigPin, OUTPUT);
	pinMode(echoPin, INPUT);
	Serial.begin(9600);
}

void loop() {
	// send ultrasonic pulse
	digitalWrite(trigPin, LOW);
	delayMicroseconds(2);
	digitalWrite(trigPin, HIGH);
	delayMicroseconds(10);
	digitalWrite(trigPin, LOW);

	// calculate distance
	duration = pulseIn(echoPin, HIGH);
	distance.f = (duration * 0.0343) / 2;

	// write each byte of distance float
	Serial.write(distance.b[3]);
	Serial.write(distance.b[2]);
	Serial.write(distance.b[1]);
	Serial.write(distance.b[0]);

	// search for 4x 0xFF on receiver side to know where data packet ends
	Serial.write(0xFF);
	Serial.write(0xFF);
	Serial.write(0xFF);
	Serial.write(0xFF);

	delay(100);
}
