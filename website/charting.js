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
     * Label for the position dataset
     * @type {string}
     */
    let POSITION_LABEL = "Rotary Angle (radians)";

    /**
     * Label for the velocity dataset.
     * @type {string}
     */
    let VELOCITY_LABEL = "Rotary Angular Velocity (rad/s)";

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
        console.warn("Annotation plugin not found.");
    }

    let chartAngle = new Chart(ctxAngle, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: POSITION_LABEL,
                data: [],
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: 'Time (s)' } },
                y: { title: { display: true, text: POSITION_LABEL } }
            }
        }
    });

    let chartVelocity = new Chart(ctxVelocity, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: VELOCITY_LABEL,
                data: [],
                borderColor: 'rgb(153, 102, 255)',
                tension: 0.1
            }]
        },
        options: {
            scales: {
                x: { title: { display: true, text: 'Time (s)' } },
                y: { title: { display: true, text: VELOCITY_LABEL } }
            }
        }
    });

    // Add isStreaming flag
    window.isStreaming = false;

    // Add startTime
    let startTime = null;

    // Smoothing variables for ultrasonic
    let lastSmoothedPosition = 0;
    const ALPHA = 0.3; // EMA alpha (0-1); higher = more responsive 
    const OUTLIER_THRESHOLD = 500; // mm; max allowed jump from last value

    // Function to update labels based on sensor
    window.updateChartLabels = function() {
        if (window.currentSensor === 'ultrasonic') {
            POSITION_LABEL = "Distance (mm)";
            VELOCITY_LABEL = "Velocity (mm/s)";
        } else {
            POSITION_LABEL = "Rotary Angle (radians)";
            VELOCITY_LABEL = "Rotary Angular Velocity (rad/s)";
        }
        chartAngle.data.datasets[0].label = POSITION_LABEL;
        chartAngle.options.scales.y.title.text = POSITION_LABEL;
        chartVelocity.data.datasets[0].label = VELOCITY_LABEL;
        chartVelocity.options.scales.y.title.text = VELOCITY_LABEL;
        chartAngle.update();
        chartVelocity.update();
    };

    // Assumed addDataToChart function with modifications
    window.addDataToChart = function(jsonObj) {
        if (!window.isStreaming) return;

        const now = Date.now();
        if (startTime === null) startTime = now;

        const time = (now - startTime) / 1000; // time in seconds

        let position, velocity, count = 0;

        if (jsonObj.angle !== undefined) {
            position = jsonObj.angle;
            velocity = jsonObj.angularVelocity || 0;
            count = jsonObj.count || 0;
        } else if (jsonObj.distance !== undefined) {
            position = jsonObj.distance;
            // smoothing and outlier rejection for ultrasonic
            if (window.currentSensor === 'ultrasonic') {
                if (allData.length === 0) {
                    lastSmoothedPosition = position; 
                } else {
                    const delta = Math.abs(position - lastSmoothedPosition);
                    if (delta > OUTLIER_THRESHOLD) {
                        // Reject outlier use last smoothed
                        position = lastSmoothedPosition;
                    } else {
                        // Apply ema smoothing
                        position = ALPHA * position + (1 - ALPHA) * lastSmoothedPosition;
                    }
                    lastSmoothedPosition = position;
                }
            }
            // Compute velocity
            if (allData.length > 0) {
                const last = allData[allData.length - 1];
                const dt = time - last.time;
                velocity = dt > 0 ? (position - last.position) / dt : 0;
            } else {
                velocity = 0;
            }
        } else {
            return;
        }

        allData.push({ time, position, velocity, count });

        chartAngle.data.labels.push(time.toFixed(2));
        chartAngle.data.datasets[0].data.push(position);
        chartVelocity.data.labels.push(time.toFixed(2));
        chartVelocity.data.datasets[0].data.push(velocity);

        chartAngle.update();
        chartVelocity.update();
    };

    // Modify button listeners to handle sensor type
    if (startBtn) startBtn.addEventListener("click", async () => {
        if (window.currentSensor === 'rotary') {
            await sendCommand("START");
        }
        window.isStreaming = true;
        startTime = null; // Reset time on start
        statusDiv.textContent = "Streaming started.";
    });

    if (stopBtn) stopBtn.addEventListener("click", async () => {
        if (window.currentSensor === 'rotary') {
            await sendCommand("STOP");
        }
        window.isStreaming = false;
        statusDiv.textContent = "Streaming stopped.";
    });

    if (resetBtn) resetBtn.addEventListener("click", async () => {
    // send hardware reset for sensors that support it, temp fix
    if (window.currentSensor === 'rotary') {
        try {
            await sendCommand("RESET");
        } catch (err) {
            console.warn("Failed to send RESET command:", err);
        }
    }

    // Clear all data
    if (chartAngle) {
        chartAngle.data.labels = [];
        chartAngle.data.datasets.forEach(ds => { ds.data = []; });
        chartAngle.reset();           
        chartAngle.update('none');    
    }

    if (chartVelocity) {
        chartVelocity.data.labels = [];
        chartVelocity.data.datasets.forEach(ds => { ds.data = []; });
        chartVelocity.reset();
        chartVelocity.update('none');
    }

    // Reset application state
    allData = [];
    selectedPointsAngle = [];
    selectedPointsVelocity = [];
    startTime = null;
    lastSmoothedPosition = 0;
    window.isStreaming = false;

    if (typeof clearHighlightAngle     === 'function') clearHighlightAngle();
    if (typeof clearHighlightVelocity  === 'function') clearHighlightVelocity();
    if (typeof updateAnnotationsAngle  === 'function') updateAnnotationsAngle();
    if (typeof updateAnnotationsVelocity === 'function') updateAnnotationsVelocity();

    // Clear calculation displays
    if (calculationResultAngleDiv)    calculationResultAngleDiv.textContent = '';
    if (calculationResultVelocityDiv) calculationResultVelocityDiv.textContent = '';

    // UI feedback
    if (statusDiv) {
        statusDiv.textContent = window.currentSensor === 'ultrasonic'
            ? "Ultrasonic chart & data reset"
            : "Chart reset and sensor zeroed";
    }

    console.log("Reseted :", window.currentSensor || "unknown");
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
        dualModeBtn.textContent = isDual ? "Disable Two Charts" : "Enable Two Charts";
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

    // handleCsvImport
    function handleCsvImport(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const csvData = e.target.result;
            const lines = csvData.split("\n").slice(1); 

            allData = [];
            lines.forEach(line => {
                if (!line.trim()) return;
                const values = line.split(",");
                const time = parseFloat(values[0]);
                const position = parseFloat(values[1]); // was angle
                const velocity = parseFloat(values[2]); // was angularVelocity
                const count = values.length === 4 ? parseInt(values[3], 10) : 0;
                if (isNaN(time) || isNaN(position) || isNaN(velocity) || (values.length === 4 && isNaN(count))) {
                    console.warn("Invalid values in row:", line);
                    return;
                }
                allData.push({ time, position, velocity, count });
            });

            // Sort by time if needed
            allData.sort((a, b) => a.time - b.time);

            // Update charts with imported data
            chartAngle.data.labels = allData.map(d => d.time.toFixed(2));
            chartAngle.data.datasets[0].data = allData.map(d => d.position);
            chartVelocity.data.labels = allData.map(d => d.time.toFixed(2));
            chartVelocity.data.datasets[0].data = allData.map(d => d.velocity);

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

    // Assume other functions like saveAsCsv, calculateDeltaAngle, clearHighlightAngle, etc. are here (from original)

    // BLE connect (original)
    if (bleButton) bleButton.addEventListener("click", connectToESP32);

    console.log("charting.js loaded");
});