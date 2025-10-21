// web-serial api https://developer.chrome.com/docs/capabilities/serial
// web-bluetooth api https://developer.chrome.com/docs/capabilities/bluetooth

  /**
   * Element to display the serial log 
   * @type {HTMLElement|null}
   */
  const logSerialElement = document.getElementById("log-serial");

  if ("serial" in navigator) {
    console.log("serial supported");
  }

  // LIGHT SENSOR //

  // ROTARY ENCODER //

  // ULTRASONIC //

  /**
   * event listener for ultrasonic serial button 
   * @async
   */
  document.getElementById('button-ultrasonic-serial').addEventListener('click', async () => {
    try {
      await readSerialUltrasonic();
    } catch (error) {
      logSerialElement.textContent = error;
      console.error(error);
    }
  });

  /**
   * Event listener for ultrasonic BLE button 
   * @async
   */
  document.getElementById('button-ultrasonic-BLE').addEventListener('click', async () => {
    readBluetoothUltrasonic();
  });