const apiKey = "667f26b635981686419aa16a49f1de47";
let forecastChart;

function showLoader() {
  document.getElementById("loader").classList.remove("hidden");
}
function hideLoader() {
  document.getElementById("loader").classList.add("hidden");
}

async function getWeatherByCity() {
  const city = document.getElementById("cityInput").value.trim();
  if (!city) {
    alert("⚠ Please enter a city name");
    return;
  }
  showLoader();
  await fetchWeather(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=metric`);
}

function getWeatherByLocation() {
  if (!navigator.geolocation) {
    alert("❌ Geolocation not supported by your browser.");
    return;
  }

  navigator.geolocation.getCurrentPosition(async pos => {
    const { latitude, longitude } = pos.coords;
    showLoader();
    await fetchWeather(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${apiKey}&units=metric`);
  }, () => {
    alert("❌ Unable to retrieve your location.");
  });
}

async function fetchWeather(url) {
  try {
    const res = await fetch(url);
    const data = await res.json();

    if (data.cod !== 200) {
      document.getElementById("weatherInfo").innerHTML = `<p>❌ ${data.message}</p>`;
      hideLoader();
      return;
    }

    displayWeather(data);

    if (data.coord) {
      await fetchForecast(data.coord.lat, data.coord.lon);
    }

  } catch (error) {
    console.error(error);
    alert("❌ Error fetching weather data. Please try again.");
  } finally {
    hideLoader();
  }
}

function displayWeather(data) {
  const weatherHTML = `
    <h2>${data.name}, ${data.sys.country}</h2>
    <p>🌡 Temp: ${data.main.temp}°C (Feels like: ${data.main.feels_like}°C)</p>
    <p>🔼 Max: ${data.main.temp_max}°C | 🔽 Min: ${data.main.temp_min}°C</p>
    <p>☁ Condition: ${data.weather[0].description}</p>
    <p>💨 Wind: ${data.wind.speed} m/s</p>
    <p>💧 Humidity: ${data.main.humidity}%</p>
    <p>🌅 Sunrise: ${new Date(data.sys.sunrise * 1000).toLocaleTimeString()}</p>
    <p>🌇 Sunset: ${new Date(data.sys.sunset * 1000).toLocaleTimeString()}</p>
  `;
  document.getElementById("weatherInfo").innerHTML = weatherHTML;
}

async function fetchForecast(lat, lon) {
  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;
    const res = await fetch(url);
    const data = await res.json();

    displayForecast(data);

  } catch (error) {
    console.error(error);
    alert("❌ Error fetching forecast data.");
  }
}

function displayForecast(data) {
  const forecastCards = document.getElementById("forecastCards");
  forecastCards.innerHTML = "";

  const dailyData = data.list.filter(item => item.dt_txt.includes("12:00:00"));

  const labels = dailyData.map(item => new Date(item.dt_txt).toLocaleDateString());
  const temps = dailyData.map(item => item.main.temp);

  dailyData.forEach(item => {
    const date = new Date(item.dt_txt).toLocaleDateString();
    const icon = item.weather[0].icon;
    const desc = item.weather[0].description;

    forecastCards.innerHTML += `
      <div class="forecast-card">
        <p><b>${date}</b></p>
        <img src="https://openweathermap.org/img/wn/${icon}@2x.png" alt="${desc}">
        <p>${item.main.temp.toFixed(1)}°C</p>
        <p>Feels: ${item.main.feels_like.toFixed(1)}°C</p>
        <p>🔼${item.main.temp_max.toFixed(1)}°C | 🔽${item.main.temp_min.toFixed(1)}°C</p>
        <p>💧 ${item.main.humidity}%</p>
        <p>🌧 ${item.rain ? item.rain["3h"] : 0} mm</p>
      </div>
    `;
  });

  if (forecastChart) forecastChart.destroy();

  const ctx = document.getElementById("forecastChart").getContext("2d");
  forecastChart = new Chart(ctx, {
    type: "line",
    data: {
      labels: labels,
      datasets: [{
        label: "Temperature (°C)",
        data: temps,
        borderColor: "white",
        backgroundColor: "rgba(255,255,255,0.3)",
        fill: true,
        tension: 0.3,
        pointBackgroundColor: "#fff"
      }]
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: "white" } }
      },
      scales: {
        x: { ticks: { color: "white" } },
        y: { ticks: { color: "white" } }
      }
    }
  });
}
