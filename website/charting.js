// charting
// one chart for all sensors for now, looks terrible though so i commented it out

document.addEventListener("DOMContentLoaded", () => {
  console.log("Charting.js initialized");

  const startTime = Date.now();
  let chartActive = true;
  let angleOffset = 0;
  let lastAngle = 0;

  // chart
  const ctx = document.getElementById("sensorChart").getContext("2d");
  const chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Rotary Angle (radians)",
          data: [],
          borderColor: "rgba(54, 162, 235, 1)",
          borderWidth: 2,
          fill: false,
          yAxisID: "y1"
        }
        /*
        {
          label: "Ultrasonic Distance (mm)",
          data: [],
          borderColor: "rgba(255, 99, 132, 1)",
          borderWidth: 2,
          fill: false,
          yAxisID: "y2"
        },
        {
          label: "Light Level",
          data: [],
          borderColor: "rgba(255, 206, 86, 1)",
          borderWidth: 2,
          fill: false,
          yAxisID: "y3"
        }
      */
      ]
    },
    options: {
      responsive: true,
      animation: false,
      interaction: { mode: "index", intersect: false },
      plugins: { legend: { display: true, position: "top" } },
      scales: {
        x: { title: { display: true, text: "Time (s)" } },
        y1: { type: "linear", position: "left", title: { display: true, text: "Angle (rad)" } }
      }
    }
  });

  // add data to chart
  function addDataToChart(datasetLabel, value) {
    if (!chartActive) return;
    const elapsed = (Date.now() - startTime) / 1000;
    chart.data.labels.push(elapsed.toFixed(2));

    const dataset = chart.data.datasets.find(ds => ds.label === datasetLabel);
    if (dataset) dataset.data.push(value);

    if (chart.data.labels.length > 100) {
      chart.data.labels.shift();
      chart.data.datasets.forEach(ds => ds.data.shift());
    }
    chart.update();
  }

  // global hook for data 
  window.addDataToChart = function (datasetLabel, rawValue) {
    if (datasetLabel === "Rotary Angle (radians)") {
      lastAngle = rawValue;
      rawValue = rawValue - angleOffset;
    }
    addDataToChart(datasetLabel, rawValue);
  };

  // stop button
  document.getElementById("stopButton").addEventListener("click", () => {
    chartActive = false;
  });

  // reset chart
  document.getElementById("resetButton").addEventListener("click", () => {
    chart.data.labels = [];
    chart.data.datasets.forEach(ds => (ds.data = []));
    chart.update();
    chartActive = true;
  });

  window.resetChart = function () {
    chart.data.labels = [];
    chart.data.datasets.forEach(ds => (ds.data = []));
    chart.update();
    chartActive = true;
  };

  // reset angle button
  const resetAngleBtn = document.createElement("button");
  resetAngleBtn.textContent = "Reset Angle";
  resetAngleBtn.style.marginTop = "10px";
  resetAngleBtn.addEventListener("click", () => {
    angleOffset = lastAngle;
  });
  document.getElementById("chartContainer").appendChild(resetAngleBtn);

  // delta + integration
  let selectedPoints = [];

  const deltaDiv = document.createElement("div");
  deltaDiv.id = "deltaDisplay";
  deltaDiv.style.marginTop = "10px";
  deltaDiv.textContent = "Click two points on the chart to measure delta or find area.";
  document.getElementById("chartContainer").appendChild(deltaDiv);

  // calculate area button
  const calcAreaBtn = document.createElement("button");
  calcAreaBtn.textContent = "Calculate Area";
  calcAreaBtn.style.marginTop = "5px";
  calcAreaBtn.disabled = true;
  document.getElementById("chartContainer").appendChild(calcAreaBtn);

  // reset delta button
  const resetDeltaBtn = document.createElement("button");
  resetDeltaBtn.textContent = "Reset Delta";
  resetDeltaBtn.style.marginTop = "5px";
  resetDeltaBtn.addEventListener("click", () => {
    selectedPoints = [];
    deltaDiv.textContent = "Click two points on the chart to measure delta or find area";
    calcAreaBtn.disabled = true;
  });
  document.getElementById("chartContainer").appendChild(resetDeltaBtn);

  // trapezoid rule integration
  function integrateBetweenPoints(dataset, labels, i1, i2) {
    let area = 0;
    for (let i = i1; i < i2; i++) {
      const x1 = parseFloat(labels[i]);
      const x2 = parseFloat(labels[i + 1]);
      const y1 = dataset.data[i];
      const y2 = dataset.data[i + 1];
      area += Math.abs(((y1 + y2) / 2) * (x2 - x1));
    }
    return area;
  }

  // handle chart clicks
  ctx.canvas.addEventListener("click", (event) => {
    const points = chart.getElementsAtEventForMode(event, "nearest", { intersect: false }, true);

    if (points.length > 0) {
      const { datasetIndex, index } = points[0];
      const dataset = chart.data.datasets[datasetIndex];
      const x = parseFloat(chart.data.labels[index]);
      const y = dataset.data[index];

      selectedPoints.push({ datasetIndex, index, x, y });

      if (selectedPoints.length === 2) {
        const p1 = selectedPoints[0];
        const p2 = selectedPoints[1];
        const dx = (p2.x - p1.x).toFixed(2);
        const dy = (p2.y - p1.y).toFixed(2);

        deltaDiv.textContent = `ΔX (time): ${dx}s, ΔY (value): ${dy}`;
        calcAreaBtn.disabled = false;
      } else {
        deltaDiv.textContent = `Point 1: (t=${x}s, y=${y}) selected. Select another point.`;
      }
    }
  });

  // area button click handler
  calcAreaBtn.addEventListener("click", () => {
    if (selectedPoints.length === 2) {
      const p1 = selectedPoints[0];
      const p2 = selectedPoints[1];
      const dataset = chart.data.datasets[p1.datasetIndex];
      const i1 = Math.min(p1.index, p2.index);
      const i2 = Math.max(p1.index, p2.index);

      const area = integrateBetweenPoints(dataset, chart.data.labels, i1, i2).toFixed(3);
      deltaDiv.textContent += `, Area ≈ ${area}`;
    }
  });

  // ESP32 JSON handling
  let buffer = "";

  window.handleIncomingData = function (chunk) {
    buffer += chunk;
    const lines = buffer.split("\n");
    buffer = lines.pop(); 

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const json = JSON.parse(line);
        if (json.angle !== undefined) {
          window.addDataToChart("Rotary Angle (radians)", json.angle);
        }
      } catch (e) {
        console.warn("Invalid JSON from ESP32:", line);
      }
    }
  };
});
