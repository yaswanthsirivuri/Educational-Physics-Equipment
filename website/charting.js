
// charting
// one chart for all sensors

const startTime = Date.now();

// chart
const ctx = document.getElementById("sensorChart").getContext("2d");
const chart = new Chart(ctx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Rotary Angle (°)",
        data: [],
        borderColor: "rgba(54, 162, 235, 1)",
        borderWidth: 2,
        fill: false,
        yAxisID: "y1"
      },
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
    ]
  },
  options: {
    responsive: true,
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
        title: { display: true, text: "Angle (°)" }
      },
      y2: {
        type: "linear",
        position: "right",
        title: { display: true, text: "Distance (mm)" },
        grid: { drawOnChartArea: false }
      },
      y3: {
        type: "linear",
        position: "right",
        title: { display: true, text: "Light" },
        grid: { drawOnChartArea: false }
      }
    }
  }
});

// function to add data to chart 
// probably going to need to tell students to stop recording data after 1 minute otherwise the website will explode lol
function addDataToChart(datasetLabel, value) {
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
