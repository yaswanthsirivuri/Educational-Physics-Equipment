// web-serial api https://developer.chrome.com/docs/capabilities/serial
// web-bluetooth api https://developer.chrome.com/docs/capabilities/bluetooth

const BLE_service_UUID = "8bac7fbb-9890-4fef-8e2a-05c75fabe512";
const BLE_characteristic_UUID = "85af4282-a704-4944-814d-5dc715d6bd67";

const logSerialElement = document.getElementById("log-serial");

if ("serial" in navigator) {
	console.log("serial supported");
}

// LIGHT SENSOR //



// ROTARY ENCODER //



// ULTRASONIC //

document.getElementById('button-ultrasonic-serial').addEventListener('click', async () => {
	try {
		await readSerialUltrasonic();
	} catch (error) {
		logSerialElement.textContent = error;
		console.error(error);
	}
});

// BLUETOOTH //

function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

document.getElementById('button-ultrasonic-BLE').addEventListener('click', async () => {
	readBluetooth();
});

function readBluetooth() {
	navigator.bluetooth.requestDevice({
		filters: [{
			services: [BLE_service_UUID] // service UUID defined in ESP32 code
		}]
	})
	.then(device => {
		console.log("bluetooth connected to: " + device.name);
		return device.gatt.connect();
	})
	.then(server => server.getPrimaryService(BLE_service_UUID))
	.then(service => {
		console.log("service");
		return service.getCharacteristic(BLE_characteristic_UUID);
	})
	.then(characteristic => {
		console.log("value")
		return characteristic.readValue();
	})
	.then(value => {
		let distance = value.getFloat32();
		console.log("bt distance: " + distance);
	})
	.catch(error => {
		console.error(error);
	});
}
