const { useState, useEffect, useRef } = React;

function redirectToZip() {
  var zip = document.getElementById("zipInput").value;
  if (zip.trim() !== "") {
    window.location.href =
      window.location.pathname + "?zip=" + encodeURIComponent(zip);
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

function Overview(props) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const [mainIcon, setMainIcon] = useState("fa-solid fa-cloud");

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

  const fetchData = async () => {
    try {
      const response = await fetch(props.url);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const result = await response.json();
      console.log(result);
      setData(result);

      let iconSplit = result.properties.periods[0].icon.split("/");
      let iconId = `${iconSplit[iconSplit.length - 2]}-${
        iconSplit[iconSplit.length - 1].split(",")[0]
      }`;

      console.log(iconId);

      if (iconId in iconData) {
        setMainIcon(iconData[iconId]);
      } else {
        setMainIcon(iconData["day-bkn"]);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 60000); // Refresh every 60 seconds

    return () => clearInterval(interval); // Cleanup on component unmount
  }, [props.url]);

  if (error) {
    return <div>Error: {error}</div>;
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
                {data.properties.periods[0].temperature}°
                <span class="temp-small">
                  {data.properties.periods[0].temperatureUnit}
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
            </div>
          </div>
          <p class="main-text">{data.properties.periods[0].shortForecast}</p>
          <p>
            <span>{"Last Updated: "}</span>
            <span class="numerical-normal">
              {new Date(data.properties.updated).toLocaleTimeString("en-US", {
                timeZone: props.tz,
              })}
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

  const [labels, setLabels] = useState(0);
  const [temperatures, setTemperatures] = useState(0);
  const [humidities, setHumidities] = useState(0);
  const [precipChances, setPrecipChances] = useState(0);

  const fetchData = async () => {
    try {
      const response = await fetch(props.url);
      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }
      const result = await response.json();
      console.log(result);

      console.log(result.properties.periods);
      console.log(data);
      // Extracting data from data
      setLabels(result.properties.periods.map((hour) => hour.endTime)); // Assuming 'time' is a property in your hourly data
      setTemperatures(
        result.properties.periods.map((hour) => hour.temperature)
      ); // Temperatures
      setHumidities(
        result.properties.periods.map((hour) => hour.relativeHumidity.value)
      ); // Humidity values
      setPrecipChances(
        result.properties.periods.map(
          (hour) => hour.probabilityOfPrecipitation.value
        )
      ); // Precipitation chances

      setData(result.properties.periods.slice(0, 24));
    } catch (error) {
      setError(error.message);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
    }, 60000); // Refresh every 60 seconds

    return () => clearInterval(interval); // Cleanup on component unmount
  }, [props.url]);

  if (error) {
    return <div>Error: {error}</div>;
  }

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
          label: "Temperature (°F)",
          data: data.map((hour) => hour.temperature),
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
  return (
    <div id="hourly-graph">
      <canvas ref={chartRef} width="800" height="400"></canvas>
    </div>
  );
}

function WeekGraphs() {
  return <div id="week-div"></div>;
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

// Retrieve the 'id' parameter
const zip = params.get("zip");

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

  // let selectZone = initWeather.properties.forecastZone.split("/");

  // const alerts = await (
  //   await fetch(
  //     `https://api.weather.gov/alerts/active/zone/${
  //       selectZone[selectZone.length - 1]
  //     }`
  //   )
  // ).json();

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

  console.log("county", countyAlerts);

  // console.log("ALERTS", alerts);
  console.log("stateAlerts", stateAlerts);

  console.log("WEEK", weekForecast);
  console.log("init", initWeather.properties);
  const hourlyForecast = await (
    await fetch(initWeather.properties.forecastHourly)
  ).json();

  console.log("Hourly", hourlyForecast);

  ReactDOM.render(
    <>
      <Alerts alerts={countyAlerts} />
      {/* <Clock /> */}
      <div id="main-sections">
        <Overview
          user={userLocation}
          url={initWeather.properties.forecastHourly}
          tz={initWeather.properties.timeZone}
        />
        <Radar station={initWeather.properties.radarStation} />
      </div>
      <div id="secondary-sections">
        <HourlyGraphs
          url={initWeather.properties.forecastHourly}
          tz={initWeather.properties.timeZone}
        />
        <WeekGraphs
          url={initWeather.properties.forecast}
          tz={initWeather.properties.timeZone}
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
      </div>
    </>,

    document.getElementById("root")
  );
}

renderUserLocation();