// charting
// one chart for all sensors for now, looks terrible though so i commented it out

const startTime = Date.now();
let chartActive = true; 

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
    interaction: {
      mode: "index",
      intersect: false
    },
    plugins: {
      legend: {
        display: true,
        position: "top"
      }
    },
    scales: {
      x: {
        title: { display: true, text: "Time (s)" }
      },
      y1: {
        type: "linear",
        position: "left",
        title: { display: true, text: "Angle (rad)" }
      }
    }
  }
});

// function to add data to chart
function addDataToChart(datasetLabel, value) {
  if (!chartActive) return; 

  const elapsed = (Date.now() - startTime) / 1000;
  chart.data.labels.push(elapsed.toFixed(2));

  const dataset = chart.data.datasets.find(ds => ds.label === datasetLabel);
  if (dataset) {
    dataset.data.push(value);
  }

  if (chart.data.labels.length > 100) {
    chart.data.labels.shift();
    chart.data.datasets.forEach(ds => ds.data.shift());
  }

  chart.update();
}

// make function global 
window.addDataToChart = addDataToChart;

// stop button
document.getElementById("stopButton").addEventListener("click", () => {
  chartActive = false;
});

// reset button
document.getElementById("resetButton").addEventListener("click", () => {
  chart.data.labels = [];
  chart.data.datasets.forEach(ds => ds.data = []);
  chart.update();
  chartActive = true; // re-enable after reset
});

function resetChart() {
  chart.data.labels = [];
  chart.data.datasets.forEach(ds => ds.data = []);
  chart.update();
  chartActive = true;
}
window.resetChart = resetChart;

// Delta feature 
let selectedPoints = [];

// display 
const deltaDiv = document.createElement("div");
deltaDiv.id = "deltaDisplay";
deltaDiv.style.marginTop = "10px";
deltaDiv.textContent = "Click two points on the chart to measure the change.";
document.getElementById("chartContainer").appendChild(deltaDiv);

// reset button
const resetDeltaBtn = document.createElement("button");
resetDeltaBtn.textContent = "Reset Delta";
resetDeltaBtn.style.marginTop = "5px";
resetDeltaBtn.addEventListener("click", () => {
  selectedPoints = [];
  deltaDiv.textContent = "Click two points on the chart to measure the change.";
});
document.getElementById("chartContainer").appendChild(resetDeltaBtn);

// handle chart clicks
ctx.canvas.addEventListener("click", (event) => {
  const points = chart.getElementsAtEventForMode(event, "nearest", { intersect: false }, true);

  if (points.length > 0) {
    const { datasetIndex, index } = points[0];
    const dataset = chart.data.datasets[datasetIndex];
    const x = parseFloat(chart.data.labels[index]);
    const y = dataset.data[index];

    selectedPoints.push({ x, y });

    if (selectedPoints.length === 2) {
      const dx = (selectedPoints[1].x - selectedPoints[0].x).toFixed(2);
      const dy = (selectedPoints[1].y - selectedPoints[0].y).toFixed(2);
      deltaDiv.textContent = `ΔX (time): ${dx}s, ΔY (angle): ${dy}`;
    } else {
      deltaDiv.textContent = `Point 1: (t=${x}s, y=${y}) selected. Select another point.`;
    }
  }
});
