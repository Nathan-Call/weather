const { useState, useEffect, useRef } = React;

function redirectToZip() {
  let zip = document.getElementById("zipInput").value;

  let t = "f";
  if (document.getElementById("tempF").checked) {
    t = document.getElementById("tempF").value;
  } else if (document.getElementById("tempC").checked) {
    t = document.getElementById("tempC").value;
  }

  let u = "in";
  if (document.getElementById("unitIn").checked) {
    u = document.getElementById("unitIn").value;
  } else if (document.getElementById("unitCm").checked) {
    u = document.getElementById("unitCm").value;
  }

  if (zip.trim() !== "") {
    window.location.href =
      window.location.pathname +
      "?zip=" +
      encodeURIComponent(zip) +
      "&t=" +
      encodeURIComponent(t) +
      "&u=" +
      encodeURIComponent(u);
  }
  return false; // Prevent form submission
}

function Clock(props) {
  const [time, setTime] = useState(
    new Date().toLocaleTimeString("en-US", { timeZone: props.tz })
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      setTime(new Date().toLocaleTimeString("en-US", { timeZone: props.tz }));
    }, 1000);

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, []);

  return (
    <p id="clock" class="numerical sub-num">
      {time}
    </p>
  );
}

function AQIndex(props) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch(
        `http://127.0.0.1:5000/air-quality-api/${props.user.PostalCode}`
      );

      if (!response.ok) {
        throw new Error(`Response Status Code: ${response.status}`);
      }

      const result = await response.json();

      function setAQIColor(index) {
        if (index > 300) {
          return "#7e0023";
        } else if (index > 200) {
          return "#8f3f97";
        } else if (index > 150) {
          return "#ff0000";
        } else if (index > 100) {
          return "#ff7e00";
        } else if (index > 50) {
          return "#ffff00";
        } else if (index >= 0) {
          return "#00e400";
        } else {
          return "#ffffff";
        }
      }

      let largestAQIObj = { AQI: 0 };

      for (let x = 0; x < result.length; x++) {
        if (result[x].AQI > largestAQIObj.AQI) {
          largestAQIObj = result[x];
        }
      }

      if (JSON.stringify(largestAQIObj) === JSON.stringify({ AQI: 0 })) {
        throw new Error("Empty AQI Array");
      }

      largestAQIObj.aqiColor = setAQIColor(Number(largestAQIObj.AQI));
      setData(largestAQIObj);
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 300000); // Refresh every 60 seconds

    return () => clearInterval(interval); // Cleanup on component unmount
  }, [props.url]);
  if (error) {
    return (
      <span id="aqi" style={{ color: "#ffffff1a", marginRight: "10px" }}>
        <i class="fa-solid fa-smog"></i>
      </span>
    );
  }

  return (
    <span id="aqi" class="numerical sub-num" style={{ marginRight: "10px" }}>
      {data ? (
        <>
          <i
            id="aqi-icon"
            class="fa-solid fa-smog"
            style={{ color: data.aqiColor }}
          ></i>
          {data.AQI}
        </>
      ) : null}
    </span>
  );
}

function UVIndex(props) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch(
        `https://data.epa.gov/efservice/getEnvirofactsUVHOURLY/ZIP/${props.user.PostalCode}/JSON`
      );
      if (!response.ok) {
        throw new Error(`Response Status Code: ${response.status}`);
      }
      const result = await response.json();

      function parseDateString(dateString) {
        // Split the date and time parts
        let [datePart, timePart, meridiem] = dateString.split(" ");

        // Split the date part into month, day, and year
        let [month, day, year] = datePart.split("/");

        // Convert month abbreviation to a number
        const monthAbbreviations = {
          Jan: 0,
          Feb: 1,
          Mar: 2,
          Apr: 3,
          May: 4,
          Jun: 5,
          Jul: 6,
          Aug: 7,
          Sep: 8,
          Oct: 9,
          Nov: 10,
          Dec: 11,
        };

        let monthIndex = monthAbbreviations[month];

        // Split the time part into hours and minutes
        let [hour, minute] = timePart.split(":");

        // Convert hour to 24-hour format based on meridiem
        hour = parseInt(hour, 10);
        if (meridiem === "PM" && hour !== 12) {
          hour += 12;
        } else if (meridiem === "AM" && hour === 12) {
          hour = 0;
        }

        // Create a new Date object
        let date = new Date(
          year,
          monthIndex,
          parseInt(day, 10),
          hour,
          minute ? parseInt(minute, 10) : 0
        );

        return date;
      }

      let now = new Date(
        new Date().toLocaleString("en-US", { timeZone: props.tz })
      );

      let diffRef = { min: 100000000 };
      for (let i = 0; i < result.length; i++) {
        if (
          Math.abs(parseDateString(result[i].DATE_TIME) - now) < diffRef.min
        ) {
          diffRef = {
            min: Math.abs(parseDateString(result[i].DATE_TIME) - now),
            idx: i,
          };
        }
      }

      let selectedUVI = {};
      selectedUVI = result[diffRef.idx];

      function setUVColor(index) {
        if (index > 10) {
          return "#6c49c9";
        } else if (index > 7) {
          return "#d90011";
        } else if (index > 5) {
          return "#f95901";
        } else if (index > 2) {
          return "#f7e401";
        } else if (index >= 0) {
          return "#299501";
        } else {
          return "#ffffff";
        }
      }

      if (!("UV_VALUE" in selectedUVI)) {
        throw new Error("UV_VALUE Error");
      }

      selectedUVI.uvColor = setUVColor(Number(selectedUVI.UV_VALUE));
      setData(selectedUVI);
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 300000); // Refresh every 60 seconds

    return () => clearInterval(interval); // Cleanup on component unmount
  }, [props.url]);
  if (error) {
    return (
      <span id="uvi" style={{ color: "#ffffff1a" }}>
        <i class="fa-solid fa-sun"></i>
      </span>
    );
  }

  return (
    <span id="uvi" class="numerical sub-num">
      {data ? (
        <>
          <i
            id="uvi-icon"
            class="fa-solid fa-sun"
            style={{ color: data.uvColor }}
          ></i>
          {data.UV_VALUE}
        </>
      ) : null}
    </span>
  );
}

function tempCF(t = 0, input = "F", output = "F", returnUnit = false) {
  if (input == output) {
    if (returnUnit) {
      return output.trim();
    } else {
      return Math.round(Number(t));
    }
  } else {
    if (input == "F") {
      if (returnUnit) {
        return "C".trim();
      } else {
        return Math.round((Number(t) - 32) * (5 / 9));
      }
    } else {
      if (returnUnit) {
        return "F".trim();
      } else {
        return Math.round((9 / 5) * Number(t) + 32);
      }
    }
  }
}

function iconSelect(iconCode, isExact = true) {
  let iconData = {
    "day-skc": "fa-solid fa-sun",
    "night-skc": "fa-solid fa-moon",
    "day-few": "fa-solid fa-sun",
    "night-few": "fa-solid fa-moon",
    "day-sct": "fa-solid fa-cloud-sun",
    "night-sct": "fa-solid fa-cloud-moon",
    "day-bkn": "fa-solid fa-cloud",
    "night-bkn": "fa-solid fa-cloud",
    "day-ovc": "fa-solid fa-cloud",
    "night-ovc": "fa-solid fa-cloud",
    "day-wind_skc": "fa-solid fa-wind",
    "night-wind_skc": "fa-solid fa-wind",
    "day-wind_few": "fa-solid fa-wind",
    "night-wind_few": "fa-solid fa-wind",
    "day-wind_sct": "fa-solid fa-cloud-sun",
    "night-wind_sct": "fa-solid fa-cloud-moon",
    "day-wind_bkn": "fa-solid fa-cloud",
    "night-wind_bkn": "fa-solid fa-cloud",
    "day-wind_ovc": "fa-solid fa-cloud",
    "night-wind_ovc": "fa-solid fa-cloud",
    "day-snow": "fa-solid fa-snowflake",
    "night-snow": "fa-solid fa-snowflake",
    "day-rain_snow": "fa-solid fa-snowflake",
    "night-rain_snow": "fa-solid fa-snowflake",
    "day-rain_sleet": "fa-solid fa-snowflake",
    "night-rain_sleet": "fa-solid fa-snowflake",
    "day-snow_sleet": "fa-solid fa-snowflake",
    "night-snow_sleet": "fa-solid fa-snowflake",
    "day-fzra": "fa-solid fa-icicles",
    "night-fzra": "fa-solid fa-icicles",
    "day-rain_fzra": "fa-solid fa-icicles",
    "night-rain_fzra": "fa-solid fa-icicles",
    "day-snow_fzra": "fa-solid fa-icicles",
    "night-snow_fzra": "fa-solid fa-icicles",
    "day-sleet": "fa-solid fa-cloud-rain",
    "night-sleet": "fa-solid fa-cloud-rain",
    "day-rain": "fa-solid fa-cloud-rain",
    "night-rain": "fa-solid fa-cloud-rain",
    "day-rain_showers": "fa-solid fa-cloud-showers-heavy",
    "night-rain_showers": "fa-solid fa-cloud-showers-heavy",
    "day-rain_showers_hi": "fa-solid fa-cloud-sun-rain",
    "night-rain_showers_hi": "fa-solid fa-cloud-moon-rain",
    "day-tsra": "fa-solid fa-cloud-bolt",
    "night-tsra": "fa-solid fa-cloud-bolt",
    "day-tsra_sct": "fa-solid fa-cloud-bolt",
    "night-tsra_sct": "fa-solid fa-cloud-bolt",
    "day-tsra_hi": "fa-solid fa-cloud-bolt",
    "night-tsra_hi": "fa-solid fa-cloud-bolt",
    "day-tornado": "fa-solid fa-tornado",
    "night-tornado": "fa-solid fa-tornado",
    "day-hurricane": "fa-solid fa-hurricane",
    "night-hurricane": "fa-solid fa-hurricane",
    "day-tropical_storm": "fa-solid fa-hurricane",
    "night-tropical_storm": "fa-solid fa-hurricane",
    "day-dust": "fa-solid fa-smog",
    "night-dust": "fa-solid fa-smog",
    "day-smoke": "fa-solid fa-smog",
    "night-smoke": "fa-solid fa-smog",
    "day-haze": "fa-solid fa-smog",
    "night-haze": "fa-solid fa-smog",
    "day-hot": "fa-solid fa-temperature-full",
    "night-hot": "fa-solid fa-temperature-full",
    "day-cold": "fa-solid fa-temperature-empty",
    "night-cold": "fa-solid fa-temperature-empty",
    "day-blizzard": "fa-solid fa-snowflake",
    "night-blizzard": "fa-solid fa-snowflake",
    "day-fog": "fa-solid fa-smog",
    "night-fog": "fa-solid fa-smog",
  };

  if (isExact) {
    if (iconCode in iconData) {
      return iconData[iconCode];
    } else {
      return iconData["day-bkn"];
    }
  } else {
    let iconSplit = iconCode.split("/");
    let iconId = `${iconSplit[iconSplit.indexOf("day")]}-${
      iconSplit[iconSplit.indexOf("day") + 1]
        .split(",")[0]
        .split("?")[0]
        .split("&")[0]
    }`;
    return iconData[iconId];
  }
}

function getDailySnowfallTotals(data) {
  const dailySums = {};

  data.values.forEach((entry) => {
    const date = new Date(entry.validTime.split("T")[0])
      .toISOString()
      .split("T")[0]; // Extract the date
    if (!dailySums[date]) {
      dailySums[date] = 0;
    }
    dailySums[date] += entry.value; // Sum snowfall amounts for the day
  });

  return dailySums; // Return the object with dates as keys
}

function convertMm(mm, unit) {
  if (unit === "in") {
    return roundToFraction(parseFloat(mm / 25.4));
  } else if (unit === "cm") {
    return parseFloat((mm / 10).toFixed(1));
  }
}

function roundToFraction(value) {
  const inches = Math.floor(value); // Get the whole number part
  const fractionalPart = value - inches;

  const fractions = [
    { value: 0, display: "" },
    { value: 1 / 4, display: "¼" },
    { value: 1 / 2, display: "½" },
    { value: 3 / 4, display: "¾" },
  ];

  // Find the closest fraction
  const closestFraction = fractions.reduce((prev, curr) =>
    Math.abs(curr.value - fractionalPart) <
    Math.abs(prev.value - fractionalPart)
      ? curr
      : prev
  );

  // Format the result
  return `${inches > 0 ? inches : ""}${closestFraction.display}`;
}

function Snowfall(props) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [date, setDate] = useState(props.date);

  useEffect(() => {
    const intervalId = setInterval(() => {
      setDate(props.date);
    }, 300000);

    return () => clearInterval(intervalId); // Cleanup interval on unmount
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(props.url);
      if (!response.ok) {
        throw new Error(`Response Status Code: ${response.status}`);
      }
      const result = await response.json();
      const snowfallResult = getDailySnowfallTotals(
        result.properties.snowfallAmount
      );

      setData(snowfallResult);
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 300000); // Refresh every 60 seconds

    return () => clearInterval(interval); // Cleanup on component unmount
  }, [props.url]);

  if (error) {
    return null;
    // return (
    //   <div class="error-div">
    //     <i class="fa-solid fa-info-circle"></i> Error (Overview): {error}
    //   </div>
    // );
  }
  //<p class="main-text">{data.properties.periods[0].name}</p>
  return (
    <>
      {data && date ? (
        <>
          {data[date] ? (
            <>
              {data[date] != 0 ? (
                <div class="snowfall">
                  <i class="fa-solid fa-snowflake"></i>
                  <span class="snowfall-num">{convertMm(data[date], u)}</span>
                  <span class="snowfall-unit"> {u}</span>
                </div>
              ) : null}
            </>
          ) : null}
        </>
      ) : null}
    </>
  );
}

function Overview(props) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const [mainIcon, setMainIcon] = useState("fa-solid fa-cloud");

  const fetchData = async () => {
    try {
      const response = await fetch(props.url);
      if (!response.ok) {
        throw new Error(`Response Status Code: ${response.status}`);
      }
      const result = await response.json();
      setData(result);

      let iconSplit = result.properties.periods[0].icon.split("/");
      let iconId = `${iconSplit[iconSplit.length - 2]}-${
        iconSplit[iconSplit.length - 1].split(",")[0]
      }`;

      setMainIcon(iconSelect(iconId));
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 300000); // Refresh every 60 seconds

    return () => clearInterval(interval); // Cleanup on component unmount
  }, [props.url]);

  if (error) {
    return (
      <div class="error-div">
        <i class="fa-solid fa-info-circle"></i> Error (Overview): {error}
      </div>
    );
  }
  //<p class="main-text">{data.properties.periods[0].name}</p>
  return (
    <div id="overview-div">
      {data ? (
        <>
          <h1>Weather App</h1>
          <div id="overview-card">
            <div id="overview-1">
              <p class="numerical large-icon">
                <i class={mainIcon}></i>
              </p>
              <p class="numerical main-num">
                {tempCF(
                  data.properties.periods[0].temperature,
                  data.properties.periods[0].temperatureUnit.toUpperCase(),
                  props.t.toUpperCase(),
                  false
                )}
                {"°"}
                <span class="temp-small">
                  {tempCF(
                    data.properties.periods[0].temperature,
                    data.properties.periods[0].temperatureUnit.toUpperCase(),
                    props.t.toUpperCase(),
                    true
                  )}
                </span>
              </p>
            </div>

            <div id="overview-2">
              <Clock tz={props.tz} />
              <p class="city-state">
                {props.user.City}
                {", "}
                {props.user.StateCode}
              </p>
              <p class="numerical sub-num">
                <i class="fa-solid fa-droplet"></i>
                {
                  data.properties.periods[0].probabilityOfPrecipitation.value
                }% <i class="fa-solid fa-water"></i>
                {data.properties.periods[0].relativeHumidity.value}%
              </p>
              <p class="numerical sub-num">
                <i class="fa-solid fa-wind"></i>
                {data.properties.periods[0].windSpeed}{" "}
                {data.properties.periods[0].windDirection}
              </p>
              <p class="numerical sub-num">
                <AQIndex user={props.user} tz={props.tz} />
                <UVIndex user={props.user} tz={props.tz} />
              </p>
              <p class="numerical sub-num">
                <Snowfall
                  url={props.gridurl}
                  tz={props.tz}
                  date={new Date()
                    .toLocaleDateString("en-US", { timeZone: props.tz })
                    .split("/")
                    .reverse()
                    .join("-")
                    .replace(/(\d{4})-(\d{2})-(\d{2})/, "$1-$3-$2")}
                />
              </p>
            </div>
          </div>

          <p class="main-text">{data.properties.periods[0].shortForecast}</p>
          <p>
            <span>{"Last Updated: "}</span>
            <span class="numerical-normal">
              {new Date(data.properties.updateTime).toLocaleTimeString(
                "en-US",
                {
                  timeZone: props.tz,
                }
              )}
            </span>
          </p>
        </>
      ) : (
        <span>Loading...</span>
      )}
    </div>
  );
}

function toggleElement(id) {
  if (document.getElementById(id).style.display == "none") {
    document.getElementById(id).style.display = "block";
    document.getElementById(`headline-${id}`).style.borderRadius =
      "10px 10px 0 0";
  } else {
    document.getElementById(id).style.display = "none";
    document.getElementById(`headline-${id}`).style.borderRadius =
      "10px 10px 10px 10px";
  }
}

function Alerts(props) {
  return (
    <div id="alerts-div">
      {props.alerts.map((item, index) => (
        <div key={index}>
          <h3
            id={"headline-alert-" + index}
            class="alert-headline"
            onClick={() => toggleElement("alert-" + index)}
          >
            <i class="fa-solid fa-triangle-exclamation"></i>
            {item.properties.headline}
          </h3>
          <p
            id={"alert-" + index}
            class="alert-description"
            style={{ display: "none" }}
          >
            {item.properties.description}
          </p>
        </div>
      ))}
    </div>
  );
}

function HourlyGraphs(props) {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  // const [labels, setLabels] = useState(0);
  // const [temperatures, setTemperatures] = useState(0);
  // const [humidities, setHumidities] = useState(0);
  // const [precipChances, setPrecipChances] = useState(0);

  const fetchData = async () => {
    try {
      const response = await fetch(props.url);
      if (!response.ok) {
        throw new Error(`Response Status Code: ${response.status}`);
      }
      const result = await response.json();

      // Extracting data from data
      // setLabels(result.properties.periods.map((hour) => hour.endTime)); // Assuming 'time' is a property in your hourly data
      // setTemperatures(
      //   result.properties.periods.map((hour) => hour.temperature)
      // ); // Temperatures
      // setHumidities(
      //   result.properties.periods.map((hour) => hour.relativeHumidity.value)
      // ); // Humidity values
      // setPrecipChances(
      //   result.properties.periods.map(
      //     (hour) => hour.probabilityOfPrecipitation.value
      //   )
      // ); // Precipitation chances
      setData(result.properties.periods.slice(0, 24));
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 300000); // Refresh every 60 seconds

    return () => clearInterval(interval); // Cleanup on component unmount
  }, [props.url]);

  const chartRef = useRef(null); // Reference to the chart canvas
  const chartInstance = useRef(null); // Reference to the Chart.js instance

  useEffect(() => {
    // Function to destroy existing chart instance
    const destroyChart = () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
        chartInstance.current = null;
      }
    };

    // Check if chartRef and data are valid
    if (!chartRef.current || !data || data.length === 0) {
      destroyChart();
      return;
    }

    const ctx = chartRef.current.getContext("2d");

    // Example data for the chart
    const chartData = {
      labels: data.map((hour) =>
        new Intl.DateTimeFormat("en-US", {
          hour: "numeric",
          minute: "numeric",
          timeZone: props.tz,
        }).format(new Date(hour.endTime))
      ),
      datasets: [
        {
          label: `Temperature (°${tempCF(
            0,
            data[0].temperatureUnit.toUpperCase(),
            props.t.toUpperCase(),
            true
          )})`,
          data: data.map((hour) =>
            tempCF(
              hour.temperature,
              hour.temperatureUnit.toUpperCase(),
              props.t.toUpperCase(),
              false
            )
          ),
          borderColor: "#ff1a4b",
          tension: 0.1,
        },
        {
          label: "Precipitation Chance (%)",
          data: data.map((hour) => hour.probabilityOfPrecipitation.value),
          borderColor: "#1794e8",
          tension: 0.1,
        },
        {
          label: "Humidity (%)",
          data: data.map((hour) => hour.relativeHumidity.value),
          borderColor: "#ffcc00",
          tension: 0.1,
        },
      ],
    };

    // Chart.js configuration options
    const options = {
      plugins: {
        title: {
          display: true,
          text: "24 Hour Weather Forecast",
          color: "white", // Title color
          font: {
            family: "Red Hat Display", // Font family
            size: 30, // Font size (in pixels)
            style: "normal", // Font style ('normal', 'italic', 'oblique')
            weight: "bold", // Font weight ('normal', 'bold', 'lighter', 'bolder', number)
          },
        },
        legend: {
          labels: {
            color: "white", // Color of legend labels
          },
        },
      },
      scales: {
        x: {
          grid: {
            color: "#ffffff1A", // Color of x-axis grid lines
          },
          ticks: {
            color: "white", // Color of x-axis labels
          },
        },
        y: {
          grid: {
            color: "#ffffff1A", // Color of y-axis grid lines
          },
          ticks: {
            color: "white", // Color of y-axis labels
          },
        },
      },
    };

    // Ensure existing chart instance is destroyed before creating new one
    destroyChart();

    // Create new chart instance
    chartInstance.current = new window.Chart(ctx, {
      type: "line",
      data: chartData,
      options: options,
    });

    // Cleanup function to destroy chart instance on unmount
    return () => {
      destroyChart();
    };
  }, [data]); // Re-render chart when data changes

  // return React.createElement(
  //   "div",
  //   { className: "hourly-div" },
  //   React.createElement(Chart.Line, { data: chartData, options: options })
  // );

  if (error) {
    return (
      <div class="error-div">
        <i class="fa-solid fa-info-circle"></i> Error (HourlyGraphs): {error}
      </div>
    );
  }

  return (
    <div id="hourly-graph">
      {screen.width > 768 ? (
        <canvas ref={chartRef} width="800" height="400"></canvas>
      ) : (
        <canvas ref={chartRef} width="400" height="500"></canvas>
      )}
    </div>
  );
}

function WeekGraphs(props) {
  const [data, setData] = useState([]);
  const [error, setError] = useState(null);

  const fetchData = async () => {
    try {
      const response = await fetch(props.url);
      if (!response.ok) {
        throw new Error(`Response Status Code: ${response.status}`);
      }
      const result = await response.json();
      if (result.properties.periods[0].isDaytime) {
        setData(result.properties.periods);
      } else {
        setData(result.properties.periods.slice(1, 13));
      }
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 300000); // Refresh every 60 seconds

    return () => clearInterval(interval); // Cleanup on component unmount
  }, [props.url]);

  if (error) {
    return (
      <div class="error-div">
        <i class="fa-solid fa-info-circle"></i> Error (WeekGraphs): {error}
      </div>
    );
  }
  return (
    <div id="week-div">
      {data.map((item, index) =>
        item.isDaytime ? (
          <div key={index}>
            <p class="week-icon">
              <i class={iconSelect(item.icon, false)}></i>
            </p>
            <p>
              <span class="day-temp numerical">
                {tempCF(
                  item.temperature,
                  item.temperatureUnit.toUpperCase(),
                  props.t.toUpperCase(),
                  false
                )}
                {"°"}
                <span class="temp-small-2">
                  {tempCF(
                    item.temperature,
                    item.temperatureUnit.toUpperCase(),
                    props.t.toUpperCase(),
                    true
                  )}
                </span>
              </span>{" "}
              <br />
              <span class="night-temp numerical">
                {tempCF(
                  data[index + 1].temperature,
                  data[index + 1].temperatureUnit.toUpperCase(),
                  props.t.toUpperCase(),
                  false
                )}
                {"°"}
                <span class="temp-small-3">
                  {tempCF(
                    data[index + 1].temperature,
                    data[index + 1].temperatureUnit.toUpperCase(),
                    props.t.toUpperCase(),
                    true
                  )}
                </span>
              </span>
            </p>
            <p class="week-name">{item.name}</p>
            <p class="week-name numerical">
              <Snowfall
                url={props.gridurl}
                tz={props.tz}
                date={item.startTime.slice(0, 10)}
              />
            </p>
          </div>
        ) : null
      )}
    </div>
  );
}

function Radar(props) {
  const [srcUrl, setSrcUrl] = useState(
    `https://radar.weather.gov/ridge/standard/${props.station}_loop.gif`
  );

  useEffect(() => {
    const updateImageUrl = () => {
      const timestamp = new Date().getTime();
      setSrcUrl(
        `https://radar.weather.gov/ridge/standard/${props.station}_loop.gif?timestamp=${timestamp}`
      );
    };

    updateImageUrl(); // Update the URL immediately
    const interval = setInterval(updateImageUrl, 60000); // Update the URL every minute

    return () => clearInterval(interval); // Cleanup interval on component unmount
  }, [props.station]);

  return (
    <div id="radar-div">
      <img src={srcUrl} alt="Weather radar" />
    </div>
  );
}

// Get the full URL
const url = new URL(window.location.href);

// Get the search parameters from the URL
const params = new URLSearchParams(url.search);

// Retrieve the zip parameter
const zip = params.get("zip");
if (params.get("zip")) {
  document.getElementById("zipInput").value = zip;
}
// Retrieve the temperature unit parameter
let t = "f";
if (params.get("t")) {
  t = params.get("t");
}

if (t == "c") {
  document.getElementById("tempC").checked = true;
  document.getElementById("tempF").checked = false;
} else {
  document.getElementById("tempC").checked = false;
  document.getElementById("tempF").checked = true;
}

// Retrieve the measurement unit parameter
let u = "in";
if (params.get("u")) {
  u = params.get("u");
}

if (u == "cm") {
  document.getElementById("unitCm").checked = true;
  document.getElementById("unitIn").checked = false;
} else {
  document.getElementById("unitCm").checked = false;
  document.getElementById("unitIn").checked = true;
}

async function renderUserLocation() {
  const userLocation = await (
    await fetch(`http://127.0.0.1:5000/zip-lookup/${zip}`)
  ).json();

  const initWeather = await (
    await fetch(
      `https://api.weather.gov/points/${userLocation.Latitude},${userLocation.Longitude}`
    )
  ).json();

  const weekForecast = await (
    await fetch(initWeather.properties.forecast)
  ).json();

  const gridpoints = await (
    await fetch(initWeather.properties.forecastGridData)
  ).json();

  const stateAlerts = await (
    await fetch(
      `https://api.weather.gov/alerts/active/area/${userLocation.StateCode}`
    )
  ).json();

  let countyAlerts = [];

  stateAlerts.features.forEach((alert) => {
    if (alert.properties.areaDesc.includes(userLocation.County)) {
      countyAlerts.push(alert);
    }
  });

  const hourlyForecast = await (
    await fetch(initWeather.properties.forecastHourly)
  ).json();

  ReactDOM.render(
    <React.StrictMode>
      <Alerts alerts={countyAlerts} />
      {/* <Clock /> */}
      <div id="main-sections">
        <Overview
          user={userLocation}
          url={initWeather.properties.forecastHourly}
          tz={initWeather.properties.timeZone}
          t={t}
          gridurl={initWeather.properties.forecastGridData}
        />
        <Radar station={initWeather.properties.radarStation} />
      </div>
      <div id="secondary-sections">
        <WeekGraphs
          url={initWeather.properties.forecast}
          tz={initWeather.properties.timeZone}
          t={t}
          gridurl={initWeather.properties.forecastGridData}
        />
        <HourlyGraphs
          url={initWeather.properties.forecastHourly}
          tz={initWeather.properties.timeZone}
          t={t}
        />
      </div>
      <div id="last-section">
        <p>
          ZIP code interpolation data provided by{" "}
          <a target="_blank" href="https://www.geonames.org/">
            GeoNames
          </a>
        </p>
        <p>
          Weather data provided by{" "}
          <a target="_blank" href="https://www.weather.gov/">
            The National Weather Service
          </a>
        </p>
        <p>
          Air Quality Index data provided by{" "}
          <a target="_blank" href="https://www.airnow.gov/">
            AirNow
          </a>
        </p>
        <p>
          Ultra Violet Index data provided by{" "}
          <a target="_blank" href="https://www.epa.gov/">
            The U.S. Environmental Protection Agency
          </a>
        </p>
      </div>
    </React.StrictMode>,

    document.getElementById("root")
  );
}

renderUserLocation();
