
// Generic Serial reader
export async function readSerial(targetElement, logElement, datasetLabel, valueKey, baudRate = 115200) {
  try {
    const port = await navigator.serial.requestPort({});
    await port.open({ baudRate });

    targetElement.textContent = "Connected to serial port - waiting for data";

    const reader = port.readable.getReader();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        reader.releaseLock();
        targetElement.textContent = "Serial port closed";
        break;
      }

      buffer += new TextDecoder().decode(value);

      while (buffer.includes("\n")) {
        const lineEnd = buffer.indexOf("\n");
        const line = buffer.substring(0, lineEnd).trim();
        buffer = buffer.substring(lineEnd + 1);

        try {
          const obj = JSON.parse(line);

          if (obj[valueKey] !== undefined) {
            targetElement.textContent = `${datasetLabel}: ${obj[valueKey].toFixed(2)}`;
            if (typeof addDataToChart === "function") {
              addDataToChart(datasetLabel, obj[valueKey]);
            }
          } else {
            console.warn(`Key "${valueKey}" missing in JSON:`, obj);
          }
        } catch (e) {
          console.warn("Invalid JSON from serial:", line);
          if (logElement) logElement.textContent = `Serial JSON error: ${e.message}`;
        }
      }
    }
  } catch (error) {
    console.error("Serial connection failed:", error);
    targetElement.textContent = "Serial disconnected";
    if (logElement) logElement.textContent = `Serial error: ${error.message}`;
  }
}

// Generic BLE connector
export async function connectBLE(serviceUUID, characteristicUUID, targetElement, datasetLabel, valueKey, logElement) {
  try {
    console.log(`Requesting device for service ${serviceUUID}`);
    targetElement.textContent = "Scanning for BLE device";

    const device = await navigator.bluetooth.requestDevice({
      filters: [{ services: [serviceUUID] }]
    });

    device.addEventListener("gattserverdisconnected", () => {
      targetElement.textContent = "Disconnected";
      if (typeof resetChart === "function") resetChart();
    });

    const server = await device.gatt.connect();
    const service = await server.getPrimaryService(serviceUUID);
    const characteristic = await service.getCharacteristic(characteristicUUID);

    await characteristic.startNotifications();
    characteristic.addEventListener("characteristicvaluechanged", (event) => {
      const value = new TextDecoder().decode(event.target.value);
      try {
        const obj = JSON.parse(value);

        if (obj[valueKey] !== undefined) {
          targetElement.textContent = `${datasetLabel}: ${obj[valueKey].toFixed(2)}`;
          if (typeof addDataToChart === "function") {
            addDataToChart(datasetLabel, obj[valueKey]);
          }
        } else {
          console.warn(`Key "${valueKey}" missing in JSON:`, obj);
        }
      } catch (e) {
        console.warn("Invalid JSON from ESP32:", value);
      }
    });

    targetElement.textContent = "Connected - waiting for data";
  } catch (error) {
    console.error(`${datasetLabel} BLE connection failed:`, error);
    targetElement.textContent = `Error: ${error.message}`;
    if (logElement) logElement.textContent = `BLE error: ${error.message}`;
  }
}
