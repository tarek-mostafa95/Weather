"use strict";
const apiKey = "44da5762b34044838d5180913241012";
let weatherWrapper = document.querySelector(".weather-wrapper");
let searchBtn = document.querySelector(".search-btn");
let locationInput = document.querySelector(".search-input");
const forecastApiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${location}&days=3`;
let debounceTimer;

//GET CURRENT USER LOCATION
async function getUserLocation() {
  const ipApiUrl = `https://api.weatherapi.com/v1/ip.json?key=${apiKey}&q=auto:ip`;
  try {
    const response = await fetch(ipApiUrl);
    const data = await response.json();
    if (data && data.country_name && data.city) {
      return { country: data.country_name, city: data.city };
    }
  } catch (error) {
    console.error("Error fetching location data:", error);
  }
  return null;
}

//GET WIND DIRECTION
function calculateAverageWindDirection(hourlyData) {
  const directionMap = {
    N: 0,
    NNE: 22.5,
    NE: 45,
    ENE: 67.5,
    E: 90,
    ESE: 112.5,
    SE: 135,
    SSE: 157.5,
    S: 180,
    SSW: 202.5,
    SW: 225,
    WSW: 247.5,
    W: 270,
    WNW: 292.5,
    NW: 315,
    NNW: 337.5,
  };
  let totalAngle = 0;
  let count = 0;
  hourlyData.forEach((hour) => {
    const windDir = hour.wind_dir;
    if (directionMap[windDir]) {
      totalAngle += directionMap[windDir];
      count++;
    }
  });
  if (count === 0) return "N/A";
  let averageAngle = totalAngle / count;
  if (averageAngle < 0) averageAngle += 360;
  return Object.keys(directionMap).reduce((prev, curr) => {
    return Math.abs(directionMap[curr] - averageAngle) <
      Math.abs(directionMap[prev] - averageAngle)
      ? curr
      : prev;
  });
}

//GET COMMON CONDITION
function calculateMostFrequentCondition(hourlyData) {
  const conditionCount = {};

  hourlyData.forEach((hour) => {
    const conditionText = hour.condition.text;
    if (conditionCount[conditionText]) {
      conditionCount[conditionText]++;
    } else {
      conditionCount[conditionText] = 1;
    }
  });

  let mostFrequentCondition = null;
  let maxCount = 0;

  for (const [condition, count] of Object.entries(conditionCount)) {
    if (count > maxCount) {
      mostFrequentCondition = condition;
      maxCount = count;
    }
  }

  return mostFrequentCondition || "N/A";
}
//CUSTOM METHOD FOR DISPLAY DAY AND MONTH
function formatDateToDayMonth(dateStr) {
  const date = new Date(dateStr);
  const day = date.getDate();
  const month = date.toLocaleString("en-US", { month: "long" });
  return `${day} ${month}`;
}

//GET WEATHER FROM API
function getWeatherForecast(location) {
  const forecastApiUrl = `https://api.weatherapi.com/v1/forecast.json?key=${apiKey}&q=${location}&days=3`;
  fetch(forecastApiUrl)
    .then((response) => {
      if (!response.ok) {
        console.log(`Location Not Found:${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      updateUI(data);
    })
    .catch((error) => console.error("Error fetching weather data:", error));
}

//UPDATE DISPLYING DATA ACCORDING TO LOCATION
function updateUI(data) {
  weatherWrapper.innerHTML = "";
  const { location, forecast } = data;
  const countryName = location.name;
  let days = "";


  forecast.forecastday.forEach((day, index) => {
    const date = new Date(day.date);
    const maxTemp = day.day.maxtemp_c;
    const minTemp = day.day.mintemp_c;
    const chanceOfRain = day.day.daily_chance_of_rain;
    const windKph = day.day.maxwind_kph;
    const windDir = calculateAverageWindDirection(day.hour);
    const overAllCondition = calculateMostFrequentCondition(day.hour).trim();
    let iconClass = "fa-regular fa-moon fa-2xl mt-5 text-info";

    // Change the icon and text based on the overall condition
    if (overAllCondition.toLowerCase().includes("rain")) {
      iconClass = "fa-solid fa-cloud-showers-heavy fa-2xl mt-5 text-info";
    } else if (overAllCondition == "Sunny") {
      iconClass = "fa-solid fa-sun fa-2xl mt-5 text-warning";
    }
    else if (overAllCondition == "Partly Cloudy") {
      iconClass = "fa-solid fa-cloud-sun fa-2xl mt-5 text-info";
    } else if ( overAllCondition.toLowerCase().includes("cloud")){
      iconClass = "fa-solid fa-cloud fa-2xl mt-5 text-info";
    }
    

    if (index === 0) {
      days += `<div class="col-lg-4 p-0">
      <div class="card weath-card rounded-strat-5 rounded-end-0">
        <div class="card-header d-flex justify-content-between">
          <p class="m-0">${date.toLocaleString("en-US", {
            weekday: "long",
          })}</p>
          <p class="m-0">${formatDateToDayMonth(day.date)}</p>
        </div>
        <div class="card-body">
          <h5 class="card-title">${countryName}</h5>
          <h2 class="card-text mt-4 display-2 text-white fw-bold">${maxTemp}<sup>o</sup>C</h2>
          <i class="${iconClass}"></i>
          <p class="text-info mt-4">${overAllCondition}</p>
          <div class="d-flex justify-content-between mt-5">
            <div><i class="fa-solid fa-umbrella"></i><span>${chanceOfRain}%</span></div>
            <div><i class="fa-solid fa-wind"></i><span>${windKph}/h</span></div>
            <div><i class="fa-regular fa-compass"></i><span>${windDir}</span></div>
          </div>
        </div>
      </div>
    </div>
  `;
    } else {
      days += `<div class="col-lg-4 p-0">
                        <div class="card weath-card rounded-strat-5 rounded-end-0 ">
                            <div class="card-header d-flex justify-content-center">
                                <p class="m-0">${date.toLocaleString("en-US", {
                                  weekday: "long",
                                })}</p>
                            </div>
                            <div class="card-body text-center">
                                <i class="${iconClass}"></i>
                                <div >
                                    <h4 class="card-text mt-5  text-white fw-bold">${maxTemp}<sup>o</sup>C</h4>
                                    <h5 class="card-text  fw-bold">${minTemp}<sup>o</sup></h5>

                                </div>
                                <p class="text-info mt-4">${overAllCondition}</p>
                               
                            </div>
                        </div>
                    </div>`;
    }
  });

  weatherWrapper.innerHTML += days;
}


async function main() {
  const locationData = await getUserLocation();
  if (locationData) {
    const { country } = locationData;
    getWeatherForecast(country);
  }
}

searchBtn.addEventListener("click", async () => {
  const newLocation = locationInput.value;
  if (newLocation) {
    await getWeatherForecast(newLocation);
  } else {
    const locationData = await getUserLocation();
    if (locationData) {
      const { country } = locationData;
      await getWeatherForecast(country);
    }
  }
});

//debounceTimer
locationInput.addEventListener("keyup", async () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(async () => {
    const newLocation = locationInput.value;
    if (newLocation) {
      await getWeatherForecast(newLocation);
    } else {
      const locationData = await getUserLocation();
      if (locationData) {
        const { country } = locationData;
        await getWeatherForecast(country);
      }
    }
  }, 500);
});

main();
