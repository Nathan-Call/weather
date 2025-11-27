const { createContext, useContext, useState, useEffect, useRef } = React;

const TContext = createContext();

function TProvider({ children }) {
  const [t, setT] = useState("F");

  const [u, setU] = useState("in");

  return <TContext.Provider value={{ t, setT, u, setU }}>{children}</TContext.Provider>;
}

function useT() {
  return useContext(TContext);
}

function redirectToZip(z = "") {
  let zip = document.getElementById("zipInput").value;
  if (z != "") {
    zip = z;
  }

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

function toggleUnit(z = "") {
  let zip = document.getElementById("zipInput").value;
  if (z != "") {
    zip = z;
  }

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
  console.log(t, u);
  if (zip.trim() !== "") {
    const newUrl =
      window.location.pathname +
      "?zip=" +
      encodeURIComponent(zip) +
      "&t=" +
      encodeURIComponent(t) +
      "&u=" +
      encodeURIComponent(u);

    window.history.pushState(null, "", newUrl);
  }

  const eventT = new CustomEvent("updateT", { detail: t });
  window.dispatchEvent(eventT);

  const eventU = new CustomEvent("updateU", { detail: u });
  window.dispatchEvent(eventU);
}

function Clock(props) {
  const [time, setTime] = useState(new Date().toLocaleTimeString("en-US", { timeZone: props.tz }));

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
      const response = await fetch(`http://127.0.0.1:5000/air-quality-api/${props.user.PostalCode}`);

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
          <i id="aqi-icon" class="fa-solid fa-smog" style={{ color: data.aqiColor }}></i>
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
        let date = new Date(year, monthIndex, parseInt(day, 10), hour, minute ? parseInt(minute, 10) : 0);

        return date;
      }

      let now = new Date(new Date().toLocaleString("en-US", { timeZone: props.tz }));

      let diffRef = { min: 100000000 };
      for (let i = 0; i < result.length; i++) {
        if (Math.abs(parseDateString(result[i].DATE_TIME) - now) < diffRef.min) {
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
          <i id="uvi-icon" class="fa-solid fa-sun" style={{ color: data.uvColor }}></i>
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
      iconSplit[iconSplit.indexOf("day") + 1].split(",")[0].split("?")[0].split("&")[0]
    }`;
    return iconData[iconId];
  }
}

function getDailySnowfallTotals(data) {
  const dailySums = {};

  data.values.forEach((entry) => {
    const date = new Date(entry.validTime.split("T")[0]).toISOString().split("T")[0]; // Extract the date
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
  let closestFraction = fractions.reduce((prev, curr) =>
    Math.abs(curr.value - fractionalPart) < Math.abs(prev.value - fractionalPart) ? curr : prev
  );

  // Handle the edge case of very small values
  if (value > 0 && value < 0.126) {
    closestFraction = { value: 1 / 8, display: "⅛" };
  }

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
      const snowfallResult = getDailySnowfallTotals(result.properties.snowfallAmount);
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
                  <span class="snowfall-num">{convertMm(data[date], props.u)}</span>
                  <span class="snowfall-unit"> {props.u}</span>
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

  const [stateT, setStateT] = useState(props.t);

  useEffect(() => {
    const handleTUpdate = (event) => {
      setStateT(event.detail); // Update React state when event is fired
    };

    window.addEventListener("updateT", handleTUpdate);

    return () => {
      window.removeEventListener("updateT", handleTUpdate);
    };
  }, []);

  const [stateU, setStateU] = useState(props.u);

  useEffect(() => {
    const handleUUpdate = (event) => {
      setStateU(event.detail); // Update React state when event is fired
    };

    window.addEventListener("updateU", handleUUpdate);

    return () => {
      window.removeEventListener("updateU", handleUUpdate);
    };
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(props.url);
      if (!response.ok) {
        throw new Error(`Response Status Code: ${response.status}`);
      }
      const result = await response.json();
      setData(result);

      let iconSplit = result.properties.periods[0].icon.split("/");
      let iconId = `${iconSplit[iconSplit.length - 2]}-${iconSplit[iconSplit.length - 1].split(",")[0]}`;

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
                  stateT.toUpperCase(),
                  false
                )}
                {"°"}
                <span class="temp-small">
                  {tempCF(
                    data.properties.periods[0].temperature,
                    data.properties.periods[0].temperatureUnit.toUpperCase(),
                    stateT.toUpperCase(),
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
                {data.properties.periods[0].probabilityOfPrecipitation.value}% <i class="fa-solid fa-water"></i>
                {data.properties.periods[0].relativeHumidity.value}%
              </p>
              <p class="numerical sub-num">
                <i class="fa-solid fa-wind"></i>
                {data.properties.periods[0].windSpeed} {data.properties.periods[0].windDirection}
              </p>
              <p class="numerical sub-num">
                <AQIndex user={props.user} tz={props.tz} />
                <UVIndex user={props.user} tz={props.tz} />
              </p>
              <p class="numerical sub-num">
                <Snowfall
                  url={props.gridurl}
                  tz={props.tz}
                  u={stateU}
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
          <div id="overview-sub-div">
            <p class="main-text">{data.properties.periods[0].shortForecast}</p>
            <p>
              <span>{"Last Updated: "}</span>
              <span class="numerical-normal">
                {new Date(data.properties.updateTime).toLocaleTimeString("en-US", {
                  timeZone: props.tz,
                })}
              </span>
            </p>
          </div>
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
    document.getElementById(`headline-${id}`).style.borderRadius = "10px 10px 0 0";
  } else {
    document.getElementById(id).style.display = "none";
    document.getElementById(`headline-${id}`).style.borderRadius = "10px 10px 10px 10px";
  }
}

function Alerts(props) {
  return (
    <div id="alerts-div">
      {props.alerts.map((item, index) => (
        <div key={index}>
          <h3 id={"headline-alert-" + index} class="alert-headline" onClick={() => toggleElement("alert-" + index)}>
            <i class="fa-solid fa-triangle-exclamation"></i>
            {item.properties.headline}
          </h3>
          <p id={"alert-" + index} class="alert-description" style={{ display: "none" }}>
            {item.properties.description}
          </p>
        </div>
      ))}
    </div>
  );
}

function City(props) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  const [mainIcon, setMainIcon] = useState("fa-solid fa-cloud");

  const [stateT, setStateT] = useState(props.t);

  useEffect(() => {
    const handleTUpdate = (event) => {
      setStateT(event.detail); // Update React state when event is fired
    };

    window.addEventListener("updateT", handleTUpdate);

    return () => {
      window.removeEventListener("updateT", handleTUpdate);
    };
  }, []);

  // const [stateU, setStateU] = useState(props.u);

  // useEffect(() => {
  //   const handleUUpdate = (event) => {
  //     setStateU(event.detail); // Update React state when event is fired
  //   };

  //   window.addEventListener("updateU", handleUUpdate);

  //   return () => {
  //     window.removeEventListener("updateU", handleUUpdate);
  //   };
  // }, []);

  const fetchData = async () => {
    try {
      const response = await fetch(props.url);
      if (!response.ok) {
        throw new Error(`Response Status Code: ${response.status}`);
      }
      const result = await response.json();
      setData(result);

      let iconSplit = result.properties.periods[0].icon.split("/");
      let iconId = `${iconSplit[iconSplit.length - 2]}-${iconSplit[iconSplit.length - 1].split(",")[0]}`;

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
    <>
      {data ? (
        <>
          <div class="city-card" onClick={() => redirectToZip(props.zip)}>
            <div class="city-sec-1">
              <p class="numerical city-icon">
                <i class={mainIcon}></i>
              </p>
              <p class="numerical city-num">
                {tempCF(
                  data.properties.periods[0].temperature,
                  data.properties.periods[0].temperatureUnit.toUpperCase(),
                  stateT.toUpperCase(),
                  false
                )}
                {"°"}
                <span class="city-temp-small">
                  {tempCF(
                    data.properties.periods[0].temperature,
                    data.properties.periods[0].temperatureUnit.toUpperCase(),
                    stateT.toUpperCase(),
                    true
                  )}
                </span>
              </p>
            </div>

            <div class="city-sec-2">
              <Clock tz={props.tz} />
              <p class="city-state">
                {props.city}
                {", "}
                {props.stateCode}
              </p>
            </div>
          </div>
        </>
      ) : (
        <span>Loading...</span>
      )}
    </>
  );
}

function Cities(props) {
  return (
    <div id="cities-div">
      <City
        url="https://api.weather.gov/gridpoints/MTR/85,105/forecast/hourly"
        tz={"America/Los_Angeles"}
        city={"San Francisco"}
        stateCode={"CA"}
        t={props.t}
        zip={"94102"}
      />
      <City
        url="https://api.weather.gov/gridpoints/OKX/33,35/forecast/hourly"
        tz={"America/New_York"}
        city={"New York"}
        stateCode={"NY"}
        t={props.t}
        zip={"10038"}
      />
      <City
        url="https://api.weather.gov/gridpoints/LOT/75,73/forecast/hourly"
        tz={"America/Chicago"}
        city={"Chicago"}
        stateCode={"IL"}
        t={props.t}
        zip={"60606"}
      />
      <City
        url="https://api.weather.gov/gridpoints/EWX/156,91/forecast/hourly"
        tz={"America/Chicago"}
        city={"Austin"}
        stateCode={"TX"}
        t={props.t}
        zip={"78701"}
      />
      <City
        url="https://api.weather.gov/gridpoints/MFL/110,50/forecast/hourly"
        tz={"America/New_York"}
        city={"Miami"}
        stateCode={"FL"}
        t={props.t}
        zip={"33130"}
      />
      <City
        url="https://api.weather.gov/gridpoints/BOU/63,62/forecast/hourly"
        tz={"America/Denver"}
        city={"Denver"}
        stateCode={"CO"}
        t={props.t}
        zip={"80202"}
      />
      <City
        url="https://api.weather.gov/gridpoints/SEW/124,68/forecast/hourly"
        tz={"America/Los_Angeles"}
        city={"Seattle"}
        stateCode={"WA"}
        t={props.t}
        zip={"98104"}
      />
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

  const [stateT, setStateT] = useState(props.t);

  useEffect(() => {
    const handleTUpdate = (event) => {
      setStateT(event.detail); // Update React state when event is fired
    };

    window.addEventListener("updateT", handleTUpdate);

    return () => {
      window.removeEventListener("updateT", handleTUpdate);
    };
  }, []);

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
          label: `Temperature (°${tempCF(0, data[0].temperatureUnit.toUpperCase(), stateT.toUpperCase(), true)})`,
          data: data.map((hour) =>
            tempCF(hour.temperature, hour.temperatureUnit.toUpperCase(), stateT.toUpperCase(), false)
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
  }, [data, stateT]); // Re-render chart when data changes

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

  const [stateT, setStateT] = useState(props.t);

  useEffect(() => {
    const handleTUpdate = (event) => {
      setStateT(event.detail); // Update React state when event is fired
    };

    window.addEventListener("updateT", handleTUpdate);

    return () => {
      window.removeEventListener("updateT", handleTUpdate);
    };
  }, []);

  const [stateU, setStateU] = useState(props.u);

  useEffect(() => {
    const handleUUpdate = (event) => {
      setStateU(event.detail); // Update React state when event is fired
    };

    window.addEventListener("updateU", handleUUpdate);

    return () => {
      window.removeEventListener("updateU", handleUUpdate);
    };
  }, []);

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
                {tempCF(item.temperature, item.temperatureUnit.toUpperCase(), stateT.toUpperCase(), false)}
                {"°"}
                <span class="temp-small-2">
                  {tempCF(item.temperature, item.temperatureUnit.toUpperCase(), stateT.toUpperCase(), true)}
                </span>
              </span>{" "}
              <br />
              <span class="night-temp numerical">
                {tempCF(
                  data[index + 1].temperature,
                  data[index + 1].temperatureUnit.toUpperCase(),
                  stateT.toUpperCase(),
                  false
                )}
                {"°"}
                <span class="temp-small-3">
                  {tempCF(
                    data[index + 1].temperature,
                    data[index + 1].temperatureUnit.toUpperCase(),
                    stateT.toUpperCase(),
                    true
                  )}
                </span>
              </span>
            </p>
            <p class="week-name">{item.name}</p>
            <p class="week-name numerical">
              <Snowfall url={props.gridurl} tz={props.tz} u={stateU} date={item.startTime.slice(0, 10)} />
            </p>
          </div>
        ) : null
      )}
    </div>
  );
}

function Radar(props) {
  const [viewType, setViewType] = useState("radar"); // "radar" or "satellite"
  const [srcUrl, setSrcUrl] = useState("");
  const [radarMargin, setRadarMargin] = useState("75px");

  useEffect(() => {
    const updateImageUrl = () => {
      const timestamp = new Date().getTime();

      if (viewType === "radar") {
        // radar per-station animated GIF [web:29]
        setSrcUrl(`https://radar.weather.gov/ridge/standard/${props.station}_loop.gif?timestamp=${timestamp}`);
        setRadarMargin("50px");
      } else {
        // GOES-19 UMV GeoColor 600x600 GIF [web:12][web:28]
        setSrcUrl(
          `https://cdn.star.nesdis.noaa.gov/${props.region.satelliteID.toUpperCase()}/ABI/SECTOR/${props.region.regionCode.toLowerCase()}/GEOCOLOR/${props.region.satelliteID.toUpperCase()}-${props.region.regionCode.toUpperCase()}-GEOCOLOR-600x600.gif?timestamp=${timestamp}`
        );
        setRadarMargin("25px");
      }
    };

    updateImageUrl(); // set immediately
    const interval = setInterval(updateImageUrl, 60000); // refresh every minute

    return () => clearInterval(interval);
  }, [props.station, viewType]); // rerun when station or view changes

  return (
    <div
      id="radar-div"
      style={{
        marginBottom: radarMargin,
        marginTop: radarMargin,
      }}
    >
      <img src={srcUrl} alt={viewType === "radar" ? "Weather radar" : "Satellite imagery"} />
      <div id="radar-buttons">
        <button onClick={() => setViewType("radar")} disabled={viewType === "radar"}>
          Radar
        </button>
        <button onClick={() => setViewType("satellite")} disabled={viewType === "satellite"}>
          Satellite
        </button>
      </div>
    </div>
  );
}

function BackgroundRefresher(props) {
  useEffect(() => {
    const setBackground = () => {
      const ts = new Date().getTime();
      const url = `https://cdn.star.nesdis.noaa.gov/${props.region.satelliteID.toUpperCase()}/ABI/SECTOR/${props.region.regionCode.toUpperCase()}/GEOCOLOR/2400x2400.jpg?timestamp=${ts}`;

      document.documentElement.style.background = `linear-gradient(#1c253bbb, #1c253bbb), url("${url}"), #1c253b`;
      document.documentElement.style.backgroundSize = "cover";
      // document.documentElement.style.backgroundSize = "110%";
      document.documentElement.style.backgroundAttachment = "fixed";
      document.documentElement.style.backgroundPosition = "center";
    };

    setBackground();
    const id = setInterval(setBackground, 10 * 60 * 1000);

    return () => clearInterval(id);
  }, []);

  return null;
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

function LoadingIconCycler() {
  const [iconIndex, setIconIndex] = useState(0);

  const icons = [
    "fa-cloud",
    "fa-cloud-rain",
    "fa-cloud-showers-heavy",
    "fa-cloud-bolt",
    "fa-cloud-sun",
    "fa-sun",
    "fa-smog",
    "fa-snowflake",
    "fa-wind",
    "fa-hurricane",
  ];

  const loadingPhrases = [
    "Checking the skies...",
    "Watching the clouds roll by...",
    "Listening for raindrops...",
    "Calibrating sunshine levels...",
    "Updating your sky report...",
    "Downloading cloud data...",
    "Cloud syncing in progress...",
    "Contacting the cloud servers...",
    "Spinning up the forecast engine...",
    "Pinging weather satellites...",
  ];

  const [loadingPhrasePick] = useState(() => loadingPhrases[Math.floor(Math.random() * loadingPhrases.length)]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % icons.length);
    }, 1000); // every 2 seconds

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  return (
    <>
      {!new URLSearchParams(window.location.search).has("zip") ? (
        <div class="loading">
          <i class="fa fa-arrow-up" aria-hidden="true"></i>
          <span>Please enter your ZIP code.</span>
        </div>
      ) : (
        <>
          <div class="loading">
            <i style={{}} className={`fa ${icons[iconIndex]} fa-fade`} aria-hidden="true"></i>
          </div>
          <div class="loading-2">
            <span style={{ position: "absolute", top: "60%" }}>{loadingPhrasePick}</span>
          </div>
        </>
      )}
    </>
  );
}

async function renderUserLocation() {
  ReactDOM.render(<LoadingIconCycler />, document.getElementById("root"));

  if (!new URLSearchParams(window.location.search).has("zip")) {
    const ipZip = await (await fetch("https://ipapi.co/postal/")).json();
    console.log(ipZip);
    if (/^\d{5}/.test(ipZip.toString())) {
      redirectToZip(ipZip.toString());
    }
  }

  const userLocation = await (await fetch(`http://127.0.0.1:5000/zip-lookup/${zip}`)).json();
  console.log(userLocation.Latitude, userLocation.Longitude);
  const initWeather = await (
    await fetch(`https://api.weather.gov/points/${userLocation.Latitude},${userLocation.Longitude}`)
  ).json();

  // const weekForecast = await (
  //   await fetch(initWeather.properties.forecast)
  // ).json();

  // const gridpoints = await (
  //   await fetch(initWeather.properties.forecastGridData)
  // ).json();

  const stateAlerts = await (
    await fetch(`https://api.weather.gov/alerts/active/area/${userLocation.StateCode}`)
  ).json();

  let countyAlerts = [];

  stateAlerts.features.forEach((alert) => {
    if (alert.properties.areaDesc.includes(userLocation.County)) {
      countyAlerts.push(alert);
    }
  });

  const hourlyForecast = await (await fetch(initWeather.properties.forecastHourly)).json();

  console.log(userLocation.StateCode);

  const statesToNOAARegion = {
    AL: { regionCode: "smv", satelliteID: "GOES19" },
    AK: { regionCode: "cak", satelliteID: "GOES18" },
    AZ: { regionCode: "sr", satelliteID: "GOES19" },
    AR: { regionCode: "smv", satelliteID: "GOES19" },
    CA: { regionCode: "psw", satelliteID: "GOES18" },
    CO: { regionCode: "nr", satelliteID: "GOES19" },
    CT: { regionCode: "ne", satelliteID: "GOES19" },
    DC: { regionCode: "ne", satelliteID: "GOES19" },
    DE: { regionCode: "ne", satelliteID: "GOES19" },
    FL: { regionCode: "se", satelliteID: "GOES19" },
    GA: { regionCode: "se", satelliteID: "GOES19" },
    HI: { regionCode: "hi", satelliteID: "GOES18" },
    ID: { regionCode: "pnw", satelliteID: "GOES18" },
    IL: { regionCode: "umv", satelliteID: "GOES19" },
    IN: { regionCode: "cgl", satelliteID: "GOES19" },
    IA: { regionCode: "umv", satelliteID: "GOES19" },
    KS: { regionCode: "nr", satelliteID: "GOES19" },
    KY: { regionCode: "cgl", satelliteID: "GOES19" },
    LA: { regionCode: "smv", satelliteID: "GOES19" },
    ME: { regionCode: "ne", satelliteID: "GOES19" },
    MD: { regionCode: "ne", satelliteID: "GOES19" },
    MA: { regionCode: "ne", satelliteID: "GOES19" },
    MI: { regionCode: "cgl", satelliteID: "GOES19" },
    MN: { regionCode: "umv", satelliteID: "GOES19" },
    MS: { regionCode: "smv", satelliteID: "GOES19" },
    MO: { regionCode: "umv", satelliteID: "GOES19" },
    MT: { regionCode: "nr", satelliteID: "GOES19" },
    NE: { regionCode: "nr", satelliteID: "GOES19" },
    NV: { regionCode: "psw", satelliteID: "GOES18" },
    NH: { regionCode: "ne", satelliteID: "GOES19" },
    NJ: { regionCode: "ne", satelliteID: "GOES19" },
    NM: { regionCode: "sr", satelliteID: "GOES19" },
    NY: { regionCode: "ne", satelliteID: "GOES19" },
    NC: { regionCode: "se", satelliteID: "GOES19" },
    ND: { regionCode: "umv", satelliteID: "GOES19" },
    OH: { regionCode: "cgl", satelliteID: "GOES19" },
    OK: { regionCode: "sp", satelliteID: "GOES19" },
    OR: { regionCode: "pnw", satelliteID: "GOES18" },
    PA: { regionCode: "ne", satelliteID: "GOES19" },
    RI: { regionCode: "ne", satelliteID: "GOES19" },
    SC: { regionCode: "se", satelliteID: "GOES19" },
    SD: { regionCode: "umv", satelliteID: "GOES19" },
    TN: { regionCode: "cgl", satelliteID: "GOES19" },
    TX: { regionCode: "sp", satelliteID: "GOES19" },
    UT: { regionCode: "sr", satelliteID: "GOES19" },
    VT: { regionCode: "ne", satelliteID: "GOES19" },
    VA: { regionCode: "cgl", satelliteID: "GOES19" },
    WA: { regionCode: "pnw", satelliteID: "GOES18" },
    WV: { regionCode: "cgl", satelliteID: "GOES19" },
    WI: { regionCode: "umv", satelliteID: "GOES19" },
    WY: { regionCode: "nr", satelliteID: "GOES19" },
  };

  setTimeout(() => {
    ReactDOM.render(
      <React.StrictMode>
        <TProvider>
          <Cities t={t} />
          <Alerts alerts={countyAlerts} />
          {/* <Clock /> */}
          <div id="main-sections">
            <Overview
              user={userLocation}
              url={initWeather.properties.forecastHourly}
              tz={initWeather.properties.timeZone}
              t={t}
              u={u}
              gridurl={initWeather.properties.forecastGridData}
            />
            <Radar station={initWeather.properties.radarStation} region={statesToNOAARegion[userLocation.StateCode]} />
          </div>
          <div id="secondary-sections">
            <WeekGraphs
              url={initWeather.properties.forecast}
              tz={initWeather.properties.timeZone}
              t={t}
              u={u}
              gridurl={initWeather.properties.forecastGridData}
            />
            <HourlyGraphs url={initWeather.properties.forecastHourly} tz={initWeather.properties.timeZone} t={t} />
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
            <p>
              Default location data provided by{" "}
              <a target="_blank" href="https://ipapi.co/">
                IPAPI
              </a>
            </p>
            <p>
              Satellite data provided by{" "}
              <a target="_blank" href="https://www.star.nesdis.noaa.gov/GOES/index.php">
                The National Oceanic and Atmospheric Administration
              </a>
            </p>
          </div>
          <BackgroundRefresher region={statesToNOAARegion[userLocation.StateCode]} />
        </TProvider>
      </React.StrictMode>,

      document.getElementById("root")
    );
  }, 1000);
}

renderUserLocation();
