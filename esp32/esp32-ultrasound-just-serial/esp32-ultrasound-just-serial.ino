const int trigPin = 2;
const int echoPin = 16;

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
	digitalWrite(trigPin, LOW);
	delayMicroseconds(2);
	digitalWrite(trigPin, HIGH);
	delayMicroseconds(10);
	digitalWrite(trigPin, LOW);

	duration = pulseIn(echoPin, HIGH);
	distance.f = (duration * 0.0343) / 2;

	Serial.write(distance.b[3]);
	Serial.write(distance.b[2]);
	Serial.write(distance.b[1]);
	Serial.write(distance.b[0]);
	Serial.write(255);
	Serial.write(255);
	Serial.write(255);
	Serial.write(255);
	delay(100);
}
