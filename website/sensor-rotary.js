// Rotary BLE and serial

// has to match .ino
const ROTARY_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const ROTARY_CHARACTERISTIC_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

const rotarySerialElement = document.getElementById("data-rotary-serial");
const rotaryBLEElement = document.getElementById("data-rotary-BLE");
const logSerialElement = document.getElementById("log-serial");

// Serial handling for rotary encoder
async function readSerialRotary() {
  try {
    // serial port
    const port = await navigator.serial.requestPort({});
    await port.open({ baudRate: 115200 });

    rotarySerialElement.textContent = "Connected to serial port - waiting for data";

    const reader = port.readable.getReader();
    let buffer = "";

    // Read
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        reader.releaseLock();
        rotarySerialElement.textContent = "Serial port closed";
        break;
      }

      buffer += new TextDecoder().decode(value);

      // Process JSON 
      while (buffer.includes("\n")) {
        const lineEnd = buffer.indexOf("\n");
        const line = buffer.substring(0, lineEnd).trim();
        buffer = buffer.substring(lineEnd + 1);

        try {
          const obj = JSON.parse(line);
          rotarySerialElement.textContent = `Angle: ${obj.angle.toFixed(2)} rad, Count: ${obj.count}`;

          if (typeof addDataToChart === "function") {
            addDataToChart("Rotary Angle (rad)", obj.angle);
          }
        } catch (e) {
          console.warn("Invalid JSON from serial:", line);
          logSerialElement.textContent = `Serial JSON error: ${e.message}`;
        }
      }
    }
  } catch (error) {
    console.error("Serial connection failed:", error);
    rotarySerialElement.textContent = "Serial disconnected";
    logSerialElement.textContent = `Serial error: ${error.message}`;
  }
}

// Rotary BLE
document.addEventListener("DOMContentLoaded", () => {
  // Serial button event listener
  document.getElementById("button-rotary-serial").addEventListener("click", async () => {
    try {
      await readSerialRotary();
    } catch (error) {
      console.error("Serial setup failed:", error);
      logSerialElement.textContent = `Serial error: ${error.message}`;
    }
  });

  // Existing BLE code
  document.getElementById("button-rotary-BLE").addEventListener("click", async () => {
    try {
      console.log("Requesting Rotary Encoder BLE device");
      rotaryBLEElement.textContent = "Scanning for BLE device";

      const device = await navigator.bluetooth.requestDevice({
        filters: [{ services: [ROTARY_SERVICE_UUID] }],
        optionalServices: [ROTARY_SERVICE_UUID]
      });

      device.addEventListener("gattserverdisconnected", () => {
        rotaryBLEElement.textContent = "Disconnected";
        if (typeof resetChart === "function") {
          resetChart();
        }
      });

      console.log("Connecting to GATT server");
      const server = await device.gatt.connect();

      console.log("Getting service");
      const service = await server.getPrimaryService(ROTARY_SERVICE_UUID);

      console.log("Getting characteristic");
      const characteristic = await service.getCharacteristic(ROTARY_CHARACTERISTIC_UUID);

      console.log("Starting notifications");
      await characteristic.startNotifications();

      characteristic.addEventListener("characteristicvaluechanged", (event) => {
        const value = new TextDecoder().decode(event.target.value);
        try {
          const obj = JSON.parse(value);
          rotaryBLEElement.textContent = `Angle: ${obj.angle.toFixed(2)} rad, Count: ${obj.count}`;

          if (typeof addDataToChart === "function") {
            addDataToChart("Rotary Angle (rad)", obj.angle);
          }
        } catch (e) {
          console.warn("Invalid JSON from ESP32:", value);
        }
      });

      rotaryBLEElement.textContent = "Connected - waiting for data";
    } catch (error) {
      console.error("Rotary BLE connection failed:", error);
      rotaryBLEElement.textContent = `Error: ${error.message}`;
    }
  });
});