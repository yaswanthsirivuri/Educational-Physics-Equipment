
const distanceElement = document.getElementById("data-ultrasonic-serial");

// serial data sent from esp32:
// FF FF FF FF xx xx xx xx FF ...
// └---------┘ └---------┘ └-
// sync bytes |float distance

var latestBytesSerial = new Uint8Array(16); // stores the last 16 bytes received via serial
var serialCount = 0;

function latestDistanceSerial() {
	// find last 4 consecutive 0xFFs
	var serialCount = 0;
	for (var i = 15; i >= 0; i--) {
		if (latestBytesSerial[i] == 0xFF) {
			serialCount++;
		} else {
			serialCount = 0;
		}

		// found 4 0xFFs -> grab previous 4 bytes to make the float
		if (serialCount >= 4) {
			let floatBytes = latestBytesSerial.slice(i - 4, i);

			let view = new DataView(floatBytes.buffer);
			let float = view.getFloat32(0);
			return float;
		}
	}
	return -1;
}

async function readSerialUltrasonic() {
	// esp32 dev board vendorid:productid = 1a86:7523 QinHeng Electronics CH340 serial converter
	const filters = [
		{ usbVendorId: 0x1a86, usbPoductId: 0x7523 },
		{ usbVendorId: 0x2341, usbPoductId: 0x0043 }
	];
	const port = await navigator.serial.requestPort({ filters });
	await port.open({ baudRate: 9600 });
	const reader = port.readable.getReader();

	while (true) {
		const { value, done } = await reader.read();
		if (done) break;

		const serialLen = value.length;
		if (serialLen >= 16) {
			latestBytesSerial = value.slice(-16);
		} else {
			// shift old bytes back
			for (var i = serialLen; i < 16; i++) {
				latestBytesSerial[i - serialLen] = latestBytesSerial[i];
			}
			// append new bytes
			for (var i = 0; i < serialLen; i++) {
				latestBytesSerial[16 - serialLen + i] = value[i];
			}
		}

		let distance = latestDistanceSerial();
		console.log(distance);
		if (distance != -1) {
			distanceElement.textContent = distance.toFixed(1) + "mm";
		}

		sleep(200);
	}
}
