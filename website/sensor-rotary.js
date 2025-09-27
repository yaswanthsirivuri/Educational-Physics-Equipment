
// Rotary BLE and serial(coming soon)

// has to match .ino
const ROTARY_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
const ROTARY_CHARACTERISTIC_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

const rotarySerialElement = document.getElementById("data-rotary-serial");
const rotaryBLEElement = document.getElementById("data-rotary-BLE");

let startTime = Date.now();  

// rotary serial coming soon

// Rotary BLE
document.getElementById("button-rotary-BLE").addEventListener("click", async () => {
  try {
    console.log("Requesting Rotary Encoder BLE device");
    rotaryBLEElement.textContent = "Scanning for BLE device";

    const device = await navigator.bluetooth.requestDevice({
      acceptAllDevices: true,
      optionalServices: [ROTARY_SERVICE_UUID]
    });

    device.addEventListener("gattserverdisconnected", () => {
      rotaryBLEElement.textContent = "Disconnected";
      // reset chart when device disconnects
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
        rotaryBLEElement.textContent = `Angle: ${obj.angle.toFixed(2)}°, Count: ${obj.count}`;

        // add to chart
        if (typeof addData === "function") {
          const elapsed = (Date.now() - startTime) / 1000;
          addData(elapsed.toFixed(2), obj.angle);
        }
      } catch (e) {
        console.warn("Invalid JSON from ESP32:", value);
      }
    });

    rotaryBLEElement.textContent = "Connected - waiting for data";
  } catch (error) {
    console.error("Rotary BLE connection failed:", error);
    rotaryBLEElement.textContent = `Error: ${error}`;
  }
});
