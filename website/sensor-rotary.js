// rotary java script logic

  import { readSerial, connectBLE } from "./helper.js";

  /**
   * UUID for rotary BLE, has to match .ino .
   * @type {string}
   */
  const ROTARY_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";

  /**
   * UUID for the rotary BLE characteristic
   * @type {string}
   */
  const ROTARY_CHARACTERISTIC_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";

  /**
   * Element to display serial data 
   * @type {HTMLElement|null}
   */
  const rotarySerialElement = document.getElementById("data-rotary-serial");

  /**
   * Element to display BLE data 
   * @type {HTMLElement|null}
   */
  const rotaryBLEElement = document.getElementById("data-rotary-BLE");

  /**
   * Serial log messages
   * @type {HTMLElement|null}
   */
  const logSerialElement = document.getElementById("log-serial");

  /**
   * Event listener for rotary serial button 
   * @async
   */
  document.getElementById("button-rotary-serial").addEventListener("click", async () => {
    readSerial(rotarySerialElement, logSerialElement, "Rotary Angle (radians)", "angle", 115200);
  });