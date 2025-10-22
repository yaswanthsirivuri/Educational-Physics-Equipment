// charting
// only rotary sensor compatible at the moment, will add others later
// https://www.chartjs.org/docs/latest
// filling modes is under area graph not line
// https://developer.mozilla.org/en-US/docs/Web/API/Blob
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array

document.addEventListener("DOMContentLoaded", () => {
    console.log("Charting.js initialized");

    /**
     * Canvas rendering context (angle)
     * @type {CanvasRenderingContext2D}
     */
    const ctxAngle = document.getElementById("sensorChartAngle").getContext("2d");

    /**
     * Canvas rendering context (velocity)
     * @type {CanvasRenderingContext2D}
     */
    const ctxVelocity = document.getElementById("sensorChartVelocity").getContext("2d");

    /**
     * display BLE status
     * @type {HTMLElement|null}
     */
    const statusDiv = document.getElementById("data-rotary-BLE");

    /**
     * Start button 
     * @type {HTMLElement|null}
     */
    const startBtn = document.getElementById("startButton");

    /**
     * Stop button 
     * @type {HTMLElement|null}
     */
    const stopBtn = document.getElementById("stopButton");

    /**
     * Reset button 
     * @type {HTMLElement|null}
     */
    const resetBtn = document.getElementById("resetButton");

    /**
     * Toggle mode button
     * @type {HTMLElement|null}
     */
    const toggleModeBtn = document.getElementById("toggleModeButton");

    /**
     * two charts mode button
     * @type {HTMLElement|null}
     */
    const dualModeBtn = document.getElementById("dualModeButton");

    /**
     * Calculate delta button for angle
     * @type {HTMLElement|null}
     */
    const calculateDeltaAngleBtn = document.getElementById("calculateDeltaAngle");

    /**
     * Calculate area button for angle
     * @type {HTMLElement|null}
     */
    const calculateAreaAngleBtn = document.getElementById("calculateAreaAngle");

    /**
     * Calculate delta button for velocity
     * @type {HTMLElement|null}
     */
    const calculateDeltaVelocityBtn = document.getElementById("calculateDeltaVelocity");

    /**
     * Calculate area button for velocity
     * @type {HTMLElement|null}
     */
    const calculateAreaVelocityBtn = document.getElementById("calculateAreaVelocity");

    /**
     * Calculation for angle
     * @type {HTMLElement|null}
     */
    const calculationResultAngleDiv = document.getElementById("calculationResultAngle");

    /**
     * Calculation for velocity
     * @type {HTMLElement|null}
     */
    const calculationResultVelocityDiv = document.getElementById("calculationResultVelocity");

    /**
     * BLE button 
     * @type {HTMLElement|null}
     */
    const bleButton = document.getElementById("button-rotary-BLE");

    /**
     * Save CSV button 
     * @type {HTMLElement|null}
     */
    const saveCsvBtn = document.getElementById("saveCsvButton");

    /**
     * Two charts mode flag
     * @type {boolean}
     */
    let isDual = false;

    /**
     * Active chart in single mode
     * @type {string}
     */
    let activeSingle = "angle";

    /**
     * Array to store indices of selected points chart
     * @type {number[]}
     */
    let selectedPointsAngle = []; 

    /**
     * Array to store indices of selected points on the velocity chart
     * @type {number[]}
     */
    let selectedPointsVelocity = []; 

    /**
     * Array to store data points 
     * @type {Object[]}
     */
    let allData = []; // Store data

    /**
     * Label for the angle dataset
     * @type {string}
     */
    const ANGLE_LABEL = "Rotary Angle (radians)";

    /**
     * Label for the velocity dataset.
     * @type {string}
     */
    const VELOCITY_LABEL = "Rotary Angular Velocity (rad/s)";

    // register annotation plugin
    /**
     * Chart.js annotation plugin 
     * @type {Object|null}
     */
    const annotationPlugin =
      window.chartjsPluginAnnotation ||
      window['chartjs-plugin-annotation'] ||
      window.chartjs_plugin_annotation ||
      window.ChartAnnotation ||
      window.annotationPlugin ||
      null;

    if (annotationPlugin) {
        try {
            Chart.register(annotationPlugin);
            console.log("Annotation plugin registered.");
        } catch (e) {
            console.warn("Failed to register annotation plugin:", e);
        }
    } else {
        console.warn("Annotation plugin not found. Annotations will be disabled.");
    }

    // Chart setup 
    /**
     * Chart.js instance angle
     * @type {Chart}
     */
    const chartAngle = new Chart(ctxAngle, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: ANGLE_LABEL,
                data: [],
                borderColor: "rgba(54, 162, 235, 1)",
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            animation: false,
            plugins: {
                legend: { display: true, position: "top", labels: {
                    font: { size: 16 }
                } },
                annotation: { annotations: {} }
            },
            scales: {
                x: { title: { display: true, text: "Time (s)", font: { size: 18 } } },
                y: { title: { display: true, text: "Angle (rad)", font: { size: 18 } } }
            },
            onClick: (event) => {
                let elements = [];
                if (typeof chartAngle.getElementsAtEventForMode === "function") {
                    elements = chartAngle.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
                } else if (typeof Chart.getElementsAtEventForMode === "function") {
                    elements = Chart.getElementsAtEventForMode(chartAngle, event, 'nearest', { intersect: true }, true);
                }
                if (elements && elements.length > 0) {
                    const index = elements[0].index;
                    if (!selectedPointsAngle.includes(index)) {
                        selectedPointsAngle.push(index);
                        if (selectedPointsAngle.length > 2) selectedPointsAngle.shift();
                        updateAnnotationsAngle();
                        chartAngle.update();
                    }
                }
            }
        }
    });

    // Chart setup velocity
    /**
     * Chart.js instance for velocity
     * @type {Chart}
     */
    const chartVelocity = new Chart(ctxVelocity, {
        type: "line",
        data: {
            labels: [],
            datasets: [{
                label: VELOCITY_LABEL,
                data: [],
                borderColor: "rgba(255, 99, 132, 1)",
                borderWidth: 2,
                fill: false
            }]
        },
        options: {
            responsive: true,
            animation: false,
            plugins: {
                legend: { display: true, position: "top", labels: {
                    font: { size: 16 }
                } },
                annotation: { annotations: {} }
            },
            scales: {
                x: { title: { display: true, text: "Time (s)", font: { size: 18 } } },
                y: { title: { display: true, text: "Angular Velocity (rad/s)", font: { size: 18 } } }
            },
            onClick: (event) => {
                let elements = [];
                if (typeof chartVelocity.getElementsAtEventForMode === "function") {
                    elements = chartVelocity.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
                } else if (typeof Chart.getElementsAtEventForMode === "function") {
                    elements = Chart.getElementsAtEventForMode(chartVelocity, event, 'nearest', { intersect: true }, true);
                }
                if (elements && elements.length > 0) {
                    const index = elements[0].index;
                    if (!selectedPointsVelocity.includes(index)) {
                        selectedPointsVelocity.push(index);
                        if (selectedPointsVelocity.length > 2) selectedPointsVelocity.shift();
                        updateAnnotationsVelocity();
                        chartVelocity.update();
                    }
                }
            }
        }
    });

    /**
     * Function to clear highlight angle
     */
    function clearHighlightAngle() {
        if (chartAngle.data.datasets.length > 1) {
            chartAngle.data.datasets.pop();
            chartAngle.update();
        }
    }

    /**
     * Function to clear highlight velocity
     */
    function clearHighlightVelocity() {
        if (chartVelocity.data.datasets.length > 1) {
            chartVelocity.data.datasets.pop();
            chartVelocity.update();
        }
    }

    /**
     * Function to update annotations for selected points on angle 
     */
    function updateAnnotationsAngle() {
        const annotations = {};
        selectedPointsAngle.forEach((index, i) => {
            const point = { x: chartAngle.data.labels[index], y: chartAngle.data.datasets[0].data[index] };
            annotations[`point${i}`] = {
                type: 'point',
                xValue: point.x,
                yValue: point.y,
                backgroundColor: 'red',
                radius: 5,
                label: { content: `P${i + 1}`, enabled: true, position: 'top', font: { size: 14 } }
            };
        });
        if (!chartAngle.options.plugins) chartAngle.options.plugins = {};
        if (!chartAngle.options.plugins.annotation) chartAngle.options.plugins.annotation = { annotations: {} };
        chartAngle.options.plugins.annotation.annotations = annotations;
    }

    /**
     * Function to update annotations for selected points on velocity 
     */
    function updateAnnotationsVelocity() {
        const annotations = {};
        selectedPointsVelocity.forEach((index, i) => {
            const point = { x: chartVelocity.data.labels[index], y: chartVelocity.data.datasets[0].data[index] };
            annotations[`point${i}`] = {
                type: 'point',
                xValue: point.x,
                yValue: point.y,
                backgroundColor: 'red',
                radius: 5,
                label: { content: `P${i + 1}`, enabled: true, position: 'top', font: { size: 14 } }
            };
        });
        if (!chartVelocity.options.plugins) chartVelocity.options.plugins = {};
        if (!chartVelocity.options.plugins.annotation) chartVelocity.options.plugins.annotation = { annotations: {} };
        chartVelocity.options.plugins.annotation.annotations = annotations;
    }

    /**
     * Add new point to the chart(s)
     * @param {Object} json - JSON object containing angle and/or angularVelocity.
     */
    function addDataPointObj(json) {
        if (json.angle === undefined && json.angularVelocity === undefined) return;

        const elapsed = allData.length * 0.05;
        const timeStr = elapsed.toFixed(2);
        const angle = json.angle !== undefined ? json.angle : 0;
        const velocity = json.angularVelocity !== undefined ? json.angularVelocity : 0;

        chartAngle.data.labels.push(timeStr);
        chartAngle.data.datasets[0].data.push(angle);

        chartVelocity.data.labels.push(timeStr);
        chartVelocity.data.datasets[0].data.push(velocity);

        allData.push({ time: elapsed, angle: angle, angularVelocity: velocity });

        if (statusDiv) statusDiv.textContent = `Angle: ${angle.toFixed(2)} rad, Velocity: ${velocity.toFixed(2)} rad/s`;

        const MAX_POINTS = 400; 
        if (chartAngle.data.labels.length > MAX_POINTS) {
            chartAngle.data.labels.shift();
            chartAngle.data.datasets[0].data.shift();
            chartVelocity.data.labels.shift();
            chartVelocity.data.datasets[0].data.shift();
            allData.shift();
            selectedPointsAngle = selectedPointsAngle.map(idx => idx - 1).filter(idx => idx >= 0);
            selectedPointsVelocity = selectedPointsVelocity.map(idx => idx - 1).filter(idx => idx >= 0);
            updateAnnotationsAngle();
            updateAnnotationsVelocity();
        }
        chartAngle.update();
        chartVelocity.update();
    }

    /**
     * Expose function for helper.js 
     * @param {string} label - Dataset label, either ANGLE_LABEL or VELOCITY_LABEL
     * @param {number} value - Value to add to chart
     */
    window.addDataToChart = function(label, value) {
        if (label === ANGLE_LABEL) {
            addDataPointObj({ angle: Number(value) });
        } else if (label === VELOCITY_LABEL) {
            addDataPointObj({ angularVelocity: Number(value) });
        } else {
            addDataPointObj({ angle: Number(value) });
        }
    };

    /**
     * delta and area calcs (angle) 
     */
    function calculateDeltaAngle() {
        if (selectedPointsAngle.length < 2) {
            calculationResultAngleDiv.textContent = "Select two points first.";
            return;
        }
        const idx1 = Math.min(...selectedPointsAngle);
        const idx2 = Math.max(...selectedPointsAngle);
        const x1 = parseFloat(chartAngle.data.labels[idx1]);
        const y1 = chartAngle.data.datasets[0].data[idx1];
        const x2 = parseFloat(chartAngle.data.labels[idx2]);
        const y2 = chartAngle.data.datasets[0].data[idx2];
        const deltaY = y2 - y1;
        const deltaX = x2 - x1;
        const slope = deltaY / deltaX;
        calculationResultAngleDiv.textContent = `Delta: Δy = ${deltaY.toFixed(4)} rad, Δx = ${deltaX.toFixed(4)} s, Slope = ${slope.toFixed(4)} rad/s`;
    }

    /**
     * delta and area calcs (velocity) 
     */
    function calculateDeltaVelocity() {
        if (selectedPointsVelocity.length < 2) {
            calculationResultVelocityDiv.textContent = "Select two points first.";
            return;
        }
        const idx1 = Math.min(...selectedPointsVelocity);
        const idx2 = Math.max(...selectedPointsVelocity);
        const x1 = parseFloat(chartVelocity.data.labels[idx1]);
        const y1 = chartVelocity.data.datasets[0].data[idx1];
        const x2 = parseFloat(chartVelocity.data.labels[idx2]);
        const y2 = chartVelocity.data.datasets[0].data[idx2];
        const deltaY = y2 - y1;
        const deltaX = x2 - x1;
        const slope = deltaY / deltaX;
        calculationResultVelocityDiv.textContent = `Delta: Δy = ${deltaY.toFixed(4)} rad/s, Δx = ${deltaX.toFixed(4)} s, Slope = ${slope.toFixed(4)} rad/s²`;
    }

    /**
     * Calculate area for angle
     */
    function calculateAreaAngle() {
        if (selectedPointsAngle.length < 2) {
            calculationResultAngleDiv.textContent = "Select two points";
            return;
        }
        const idx1 = Math.min(...selectedPointsAngle);
        const idx2 = Math.max(...selectedPointsAngle);
        let area = 0;
        for (let i = idx1; i < idx2; i++) {
            const y1 = chartAngle.data.datasets[0].data[i];
            const y2 = chartAngle.data.datasets[0].data[i + 1];
            const dx = parseFloat(chartAngle.data.labels[i + 1]) - parseFloat(chartAngle.data.labels[i]);
            area += (y1 + y2) / 2 * dx;
        }
        calculationResultAngleDiv.textContent = `Area under curve: ${area.toFixed(4)} rad·s`;

        // highlight area
        clearHighlightAngle();
        const fullData = new Array(chartAngle.data.datasets[0].data.length).fill(null);
        for (let i = idx1; i <= idx2; i++) {
            fullData[i] = chartAngle.data.datasets[0].data[i];
        }
        const highlightDataset = {
            label: 'Area under the curve',
            data: fullData,
            borderColor: 'rgba(255, 99, 132, 0.5)',
            backgroundColor: 'rgba(255, 99, 132, 0.3)',
            fill: 'origin',
            borderWidth: 1,
            pointRadius: 0
        };
        chartAngle.data.datasets.push(highlightDataset);
        chartAngle.update();
    }

    /**
     * Calculate area for velocity
     */
    function calculateAreaVelocity() {
        if (selectedPointsVelocity.length < 2) {
            calculationResultVelocityDiv.textContent = "Select two points";
            return;
        }
        const idx1 = Math.min(...selectedPointsVelocity);
        const idx2 = Math.max(...selectedPointsVelocity);
        let area = 0;
        for (let i = idx1; i < idx2; i++) {
            const y1 = chartVelocity.data.datasets[0].data[i];
            const y2 = chartVelocity.data.datasets[0].data[i + 1];
            const dx = parseFloat(chartVelocity.data.labels[i + 1]) - parseFloat(chartVelocity.data.labels[i]);
            area += (y1 + y2) / 2 * dx;
        }
        calculationResultVelocityDiv.textContent = `Area under curve: ${area.toFixed(4)} rad`;

        // highlight the area
        clearHighlightVelocity();
        const fullData = new Array(chartVelocity.data.datasets[0].data.length).fill(null);
        for (let i = idx1; i <= idx2; i++) {
            fullData[i] = chartVelocity.data.datasets[0].data[i];
        }
        const highlightDataset = {
            label: 'Area under the curve',
            data: fullData,
            borderColor: 'rgba(255, 99, 132, 0.5)',
            backgroundColor: 'rgba(255, 99, 132, 0.3)',
            fill: 'origin',
            borderWidth: 1,
            pointRadius: 0
        };
        chartVelocity.data.datasets.push(highlightDataset);
        chartVelocity.update();
    }

    /**
     * Save chart data 
     */
    function saveAsCsv() {
        if (allData.length === 0) {
            calculationResultAngleDiv.textContent = "No data";
            return;
        }

        let csvContent = "Time (s),Angle (rad),Angular Velocity (rad/s)\n";
        allData.forEach(point => {
            csvContent += `${point.time.toFixed(2)},${point.angle.toFixed(4)},${point.angularVelocity.toFixed(4)}\n`;
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', 'sensor_data.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log("file downloaded");
    }

    /**
     * BLE device 
     * @type {BluetoothDevice|null}
     */
    let bleDevice = null;

    /**
     * BLE server instance
     * @type {BluetoothRemoteGATTServer|null}
     */
    let bleServer = null;

    /**
     * BLE command characteristic
     * @type {BluetoothRemoteGATTCharacteristic|null}
     */
    let commandChar = null;

    /**
     * BLE notify characteristic
     * @type {BluetoothRemoteGATTCharacteristic|null}
     */
    let notifyChar = null;

    /**
     * Connects to the ESP32 via BLE and sets up notifications
     * @async
     */
    async function connectToESP32() {
        try {
            const serviceUUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e";
            const notifyUUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e";
            const commandUUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e";

            if (!navigator.bluetooth) {
                statusDiv.textContent = "Web Bluetooth not supported"
                return;
            }

            statusDiv.textContent = "Connecting to ESP32...";

            bleDevice = await navigator.bluetooth.requestDevice({
                filters: [{ services: [serviceUUID] }]
            });

            bleServer = await bleDevice.gatt.connect();
            const service = await bleServer.getPrimaryService(serviceUUID);
            notifyChar = await service.getCharacteristic(notifyUUID);
            commandChar = await service.getCharacteristic(commandUUID);

            await notifyChar.startNotifications();
            notifyChar.addEventListener("characteristicvaluechanged", (event) => {
                const value = new TextDecoder().decode(event.target.value);
                try {
                    const json = JSON.parse(value);
                    addDataPointObj(json);
                } catch (e) {
                    console.warn("Invalid JSON:", value);
                }
            });

            statusDiv.textContent = "Connected. Waiting for data...";
            console.log("Connected to ESP32 via BLE");
        } catch (error) {
            console.error("BLE connection failed:", error);
            statusDiv.textContent = "Connection failed. Try again.";
        }
    }

    /**
     * Sends command to ESP32 
     * @param {string} cmd 
     * @async
     */
    async function sendCommand(cmd) {
        if (!commandChar) {
            console.warn("Command characteristic not available.");
            return;
        }
        try {
            await commandChar.writeValue(new TextEncoder().encode(cmd));
            console.log(`Sent command: ${cmd}`);
        } catch (e) {
            console.error("Failed to send command:", e);
        }
    }

    if (bleButton) bleButton.addEventListener("click", connectToESP32);

    if (startBtn) startBtn.addEventListener("click", async () => {
        await sendCommand("START");
        statusDiv.textContent = "Streaming started...";
    });
    if (stopBtn) stopBtn.addEventListener("click", async () => {
        await sendCommand("STOP");
        statusDiv.textContent = "Streaming stopped.";
    });
    if (resetBtn) resetBtn.addEventListener("click", async () => {
        await sendCommand("RESET");
        chartAngle.data.labels = [];
        chartAngle.data.datasets[0].data = [];
        chartVelocity.data.labels = [];
        chartVelocity.data.datasets[0].data = [];
        allData = [];
        selectedPointsAngle = [];
        selectedPointsVelocity = [];
        clearHighlightAngle();
        clearHighlightVelocity();
        updateAnnotationsAngle();
        updateAnnotationsVelocity();
        calculationResultAngleDiv.textContent = '';
        calculationResultVelocityDiv.textContent = '';
        chartAngle.update();
        chartVelocity.update();
        statusDiv.textContent = "Chart reset and zeroed on ESP32.";
    });

    // Mode toggles
    if (toggleModeBtn) toggleModeBtn.addEventListener("click", () => {
        activeSingle = activeSingle === "angle" ? "velocity" : "angle";
        toggleModeBtn.textContent = `Switch to ${activeSingle === "angle" ? "Velocity" : "Angle"}`;
        if (!isDual) {
            document.getElementById("angleChartContainer").style.display = activeSingle === "angle" ? "block" : "none";
            document.getElementById("velocityChartContainer").style.display = activeSingle === "velocity" ? "block" : "none";
        }
    });

    if (dualModeBtn) dualModeBtn.addEventListener("click", () => {
        isDual = !isDual;
        dualModeBtn.textContent = isDual ? "Disable Dual Charts" : "Enable Dual Charts";
        if (isDual) {
            document.getElementById("angleChartContainer").style.display = "block";
            document.getElementById("velocityChartContainer").style.display = "block";
            toggleModeBtn.style.display = "none";
        } else {
            toggleModeBtn.style.display = "inline-block";
            document.getElementById("angleChartContainer").style.display = activeSingle === "angle" ? "block" : "none";
            document.getElementById("velocityChartContainer").style.display = activeSingle === "velocity" ? "block" : "none";
        }
    });

    // other buttons
    if (calculateDeltaAngleBtn) calculateDeltaAngleBtn.addEventListener("click", calculateDeltaAngle);
    if (calculateAreaAngleBtn) calculateAreaAngleBtn.addEventListener("click", calculateAreaAngle);
    if (calculateDeltaVelocityBtn) calculateDeltaVelocityBtn.addEventListener("click", calculateDeltaVelocity);
    if (calculateAreaVelocityBtn) calculateAreaVelocityBtn.addEventListener("click", calculateAreaVelocity);
    if (saveCsvBtn) saveCsvBtn.addEventListener("click", saveAsCsv);
});