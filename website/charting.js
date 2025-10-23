// charting
// only rotary sensor compatible at the moment, will add others later
// https://www.chartjs.org/docs/latest
// filling modes is under area graph not line
// https://developer.mozilla.org/en-US/docs/Web/API/Blob
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
// https://developer.mozilla.org/en-US/docs/Web/API/FileReader
// https://www.w3schools.com/jsref/dom_obj_fileupload.asp
// https://www.papaparse.com/

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
     * File input for importing data
     * @type {HTMLInputElement|null}
     */
    const importCsvInput = document.getElementById("importCsvInput");

    /**
     * Button for CSV file import
     * @type {HTMLElement|null}
     */
    const importCsvBtn = document.getElementById("importCsvButton");

    /**
     * chart mode flag 
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
                legend: { display: true, position: "top" },
                annotation: { annotations: {} }
            },
            scales: {
                x: { title: { display: true, text: "Time (s)" } },
                y: { title: { display: true, text: "Angle (rad)" } }
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
                    if (selectedPointsAngle.includes(index)) return; 
                    selectedPointsAngle.push(index);
                    if (selectedPointsAngle.length > 2) selectedPointsAngle.shift();
                    updateAnnotationsAngle();
                    chartAngle.update();
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
                legend: { display: true, position: "top" },
                annotation: { annotations: {} }
            },
            scales: {
                x: { title: { display: true, text: "Time (s)" } },
                y: { title: { display: true, text: "Angular Velocity (rad/s)" } }
            },
            /**
             * Click events for velocity chart selecting points
             * @param {Event} event 
             */
            onClick: (event) => {
                let elements = [];
                if (typeof chartVelocity.getElementsAtEventForMode === "function") {
                    elements = chartVelocity.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
                } else if (typeof Chart.getElementsAtEventForMode === "function") {
                    elements = Chart.getElementsAtEventForMode(chartVelocity, event, 'nearest', { intersect: true }, true);
                }
                if (elements && elements.length > 0) {
                    const index = elements[0].index;
                    if (selectedPointsVelocity.includes(index)) return; 
                    selectedPointsVelocity.push(index);
                    if (selectedPointsVelocity.length > 2) selectedPointsVelocity.shift();
                    updateAnnotationsVelocity();
                    chartVelocity.update();
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
                label: { content: `P${i + 1}`, enabled: true, position: 'top' }
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
                label: { content: `P${i + 1}`, enabled: true, position: 'top' }
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
        if (typeof json.angle !== "number" || typeof json.angularVelocity !== "number") return;
        const time = (allData.length > 0 ? allData[allData.length - 1].time + 0.05 : 0);
        allData.push({
            time: time,
            angle: json.angle,
            angularVelocity: json.angularVelocity,
            count: json.count
        });
        chartAngle.data.labels.push(time.toFixed(2));
        chartAngle.data.datasets[0].data.push(json.angle);
        chartVelocity.data.labels.push(time.toFixed(2));
        chartVelocity.data.datasets[0].data.push(json.angularVelocity);
        chartAngle.update();
        chartVelocity.update();
    }

    /**
     * Calculate delta 
     */
    function calculateDeltaAngle() {
        if (selectedPointsAngle.length < 2) {
            calculationResultAngleDiv.textContent = "Select two points first.";
            return;
        }
        const idx1 = Math.min(...selectedPointsAngle);
        const idx2 = Math.max(...selectedPointsAngle);
        const x1 = parseFloat(chartAngle.data.labels[idx1]);
        const x2 = parseFloat(chartAngle.data.labels[idx2]);
        const y1 = chartAngle.data.datasets[0].data[idx1];
        const y2 = chartAngle.data.datasets[0].data[idx2];
        const deltaY = y2 - y1;
        const deltaX = x2 - x1;
        const slope = deltaX !== 0 ? deltaY / deltaX : "undefined";
        const unit = "rad/s";
        calculationResultAngleDiv.textContent = `Δy = ${deltaY.toFixed(4)} rad, Δx = ${deltaX.toFixed(4)} s, Slope = ${slope === "undefined" ? slope : slope.toFixed(4)} ${unit}`;
    }

    /**
     * area under the curve 
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
        const unit = "rad·s";
        calculationResultAngleDiv.textContent = `Area under curve: ${area.toFixed(4)} ${unit}`;

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
     * Calculates the delta 
     */
    function calculateDeltaVelocity() {
        if (selectedPointsVelocity.length < 2) {
            calculationResultVelocityDiv.textContent = "Select two points";
            return;
        }
        const idx1 = Math.min(...selectedPointsVelocity);
        const idx2 = Math.max(...selectedPointsVelocity);
        const x1 = parseFloat(chartVelocity.data.labels[idx1]);
        const x2 = parseFloat(chartVelocity.data.labels[idx2]);
        const y1 = chartVelocity.data.datasets[0].data[idx1];
        const y2 = chartVelocity.data.datasets[0].data[idx2];
        const deltaY = y2 - y1;
        const deltaX = x2 - x1;
        const slope = deltaX !== 0 ? deltaY / deltaX : "undefined";
        const unit = "rad/s²";
        calculationResultVelocityDiv.textContent = `Δy = ${deltaY.toFixed(4)} rad/s, Δx = ${deltaX.toFixed(4)} s, Slope = ${slope === "undefined" ? slope : slope.toFixed(4)} ${unit}`;
    }

    /**
     * area calc 
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
        const unit = "rad/s·s = rad";
        calculationResultVelocityDiv.textContent = `Area under curve: ${area.toFixed(4)} ${unit}`;

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
        const headers = ["Time (s)", "Angle (rad)", "Angular Velocity (rad/s)", "Count"];
        const csvRows = [headers.join(",")];
        allData.forEach(data => {
            csvRows.push([data.time, data.angle, data.angularVelocity, data.count].join(","));
        });
        const csvContent = csvRows.join("\n");
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "sensor_data.csv";
        a.click();
        URL.revokeObjectURL(url);
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

            statusDiv.textContent = "Connecting to device";

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

            statusDiv.textContent = "Connected. Waiting for data.";
            console.log("Connected to ESP32 via BLE");
        } catch (error) {
            console.error("Bluetooth connection failed:", error);
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

    /**
     * Handles the import of CSV data and updates the charts.
     * Supports CSVs with 3 or 4 columns (Time, Angle, Angular Velocity, [Count]).
     * @param {Event} event - The file input change event.
     */
    function handleCsvImport(event) {
        const file = event.target.files[0];
        if (!file) {
            console.warn("No file selected");
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const csvContent = e.target.result;
            const lines = csvContent.split(/\r?\n/); // Handle different line endings
            if (lines.length < 2) {
                console.warn("Invalid or empty CSV");
                return;
            }

            // Skip header and parse data
            allData = [];
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (!line) continue;
                const values = line.split(',');
                // Accept 3 or 4 columns
                if (values.length !== 3 && values.length !== 4) {
                    console.warn("Invalid row in CSV (expected 3 or 4 columns):", line);
                    continue;
                }
                const time = parseFloat(values[0]);
                const angle = parseFloat(values[1]);
                const angularVelocity = parseFloat(values[2]);
                // Use count if provided, otherwise default to 0
                const count = values.length === 4 ? parseInt(values[3], 10) : 0;
                if (isNaN(time) || isNaN(angle) || isNaN(angularVelocity) || (values.length === 4 && isNaN(count))) {
                    console.warn("Invalid values in row:", line);
                    continue;
                }
                allData.push({ time, angle, angularVelocity, count });
            }

            // Sort by time if needed
            allData.sort((a, b) => a.time - b.time);

            // Update charts with imported data
            chartAngle.data.labels = allData.map(d => d.time.toFixed(2));
            chartAngle.data.datasets[0].data = allData.map(d => d.angle);
            chartVelocity.data.labels = allData.map(d => d.time.toFixed(2));
            chartVelocity.data.datasets[0].data = allData.map(d => d.angularVelocity);

            // Reset selections, highlights, annotations, and results
            selectedPointsAngle = [];
            selectedPointsVelocity = [];
            clearHighlightAngle();
            clearHighlightVelocity();
            updateAnnotationsAngle();
            updateAnnotationsVelocity();
            calculationResultAngleDiv.textContent = '';
            calculationResultVelocityDiv.textContent = '';

            // Refresh charts
            chartAngle.update();
            chartVelocity.update();

            console.log("CSV imported and plotted successfully");
        };
        reader.onerror = (e) => {
            console.error("Error reading CSV:", e);
        };
        reader.readAsText(file);
    }

    /**
     * Sets up event listeners for all buttons and inputs.
     */
    if (bleButton) bleButton.addEventListener("click", connectToESP32);

    if (startBtn) startBtn.addEventListener("click", async () => {
        await sendCommand("START");
        statusDiv.textContent = "Streaming started.";
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
        statusDiv.textContent = "Chart reset and zeroed on sensor.";
    });

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

    if (calculateDeltaAngleBtn) calculateDeltaAngleBtn.addEventListener("click", calculateDeltaAngle);
    if (calculateAreaAngleBtn) calculateAreaAngleBtn.addEventListener("click", calculateAreaAngle);
    if (calculateDeltaVelocityBtn) calculateDeltaVelocityBtn.addEventListener("click", calculateDeltaVelocity);
    if (calculateAreaVelocityBtn) calculateAreaVelocityBtn.addEventListener("click", calculateAreaVelocity);
    if (saveCsvBtn) saveCsvBtn.addEventListener("click", saveAsCsv);
    if (importCsvInput) importCsvInput.addEventListener("change", handleCsvImport);
    if (importCsvBtn) importCsvBtn.addEventListener("click", () => importCsvInput.click());

    console.log("charting.js loaded");
});