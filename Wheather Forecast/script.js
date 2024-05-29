const cityInput = document.querySelector(".city-input");
const searchButton = document.querySelector(".search-btn");
const locationButton = document.querySelector(".location-btn");
const currentWeatherDiv = document.querySelector(".current-weather");
const weatherCardsDiv = document.querySelector(".weather-cards");
const recentSearchesDropdown = document.querySelector(".recent-searches-dropdown");

const API_KEY = "93de02e0e38f0ce4c1cd883bcf6631ce"; // My API key which is generated  form OpenWeatherMap API

const createWeatherCard = (cityName, weatherItem, index) => {
    if (index === 0) { // HTML for the main weather card
        return `<div class="details">
                    <h2>${cityName} (${weatherItem.dt_txt.split(" ")[0]})</h2>
                    <h6>Temperature: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h6>
                    <h6>Wind: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidity: ${weatherItem.main.humidity}%</h6>
                </div>
                <div class="icon">
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon">
                    <h6>${weatherItem.weather[0].description}</h6>
                </div>`;
    } else { // HTML for the other five day forecast card
        return `<li class="card">
                    <h3>(${weatherItem.dt_txt.split(" ")[0]})</h3>
                    <img src="https://openweathermap.org/img/wn/${weatherItem.weather[0].icon}@4x.png" alt="weather-icon">
                    <h6>Temp: ${(weatherItem.main.temp - 273.15).toFixed(2)}°C</h6>
                    <h6>Wind: ${weatherItem.wind.speed} M/S</h6>
                    <h6>Humidity: ${weatherItem.main.humidity}%</h6>
                </li>`;
    }
}

const getWeatherDetails = (cityName, latitude, longitude) => {
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/forecast?lat=${latitude}&lon=${longitude}&appid=${API_KEY}`;

    fetch(WEATHER_API_URL).then(response => response.json()).then(data => {
        const uniqueForecastDays = [];
        const fiveDaysForecast = data.list.filter(forecast => {
            const forecastDate = new Date(forecast.dt_txt).getDate();
            if (!uniqueForecastDays.includes(forecastDate)) {
                return uniqueForecastDays.push(forecastDate);
            }
        });

        cityInput.value = "";
        currentWeatherDiv.innerHTML = "";
        weatherCardsDiv.innerHTML = "";

        fiveDaysForecast.forEach((weatherItem, index) => {
            const html = createWeatherCard(cityName, weatherItem, index);
            if (index === 0) {
                currentWeatherDiv.insertAdjacentHTML("beforeend", html);
            } else {
                weatherCardsDiv.insertAdjacentHTML("beforeend", html);
            }
        });        
    }).catch(() => {
        alert("An error occurred while fetching the weather forecast!");
    });
}

const getCityCoordinates = () => {
    const cityName = cityInput.value.trim();
    if (cityName === "") {
        alert("Please enter a city name.");
        return;
    }
    const API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${cityName}&limit=1&appid=${API_KEY}`;
    
    fetch(API_URL).then(response => response.json()).then(data => {
        if (!data.length) {
            alert(`No coordinates found for ${cityName}`);
            return;
        }
        const { lat, lon, name } = data[0];
        getWeatherDetails(name, lat, lon);
        addRecentSearch(name);
    }).catch(() => {
        alert("An error occurred while fetching the coordinates!");
    });
}

const getUserCoordinates = () => {
    navigator.geolocation.getCurrentPosition(
        position => {
            const { latitude, longitude } = position.coords;
            const API_URL = `https://api.openweathermap.org/geo/1.0/reverse?lat=${latitude}&lon=${longitude}&limit=1&appid=${API_KEY}`;
            fetch(API_URL).then(response => response.json()).then(data => {
                const { name } = data[0];
                getWeatherDetails(name, latitude, longitude);
            }).catch(() => {
                alert("An error occurred while fetching the city name!");
            });
        },
        error => {
            if (error.code === error.PERMISSION_DENIED) {
                alert("Geolocation request denied. Please reset location permission to grant access again.");
            } else {
                alert("Geolocation request error. Please reset location permission.");
            }
        });
}

const addRecentSearch = (cityName) => {
    let recentSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];
    if (!recentSearches.includes(cityName)) {
        recentSearches.push(cityName);
        if (recentSearches.length > 5) recentSearches.shift(); // Limit to 5 recent searches
        localStorage.setItem("recentSearches", JSON.stringify(recentSearches));
        updateRecentSearchesDropdown();
    }
}

const updateRecentSearchesDropdown = () => {
    let recentSearches = JSON.parse(localStorage.getItem("recentSearches")) || [];
    recentSearchesDropdown.innerHTML = "";
    if (recentSearches.length > 0) {
        recentSearches.forEach(city => {
            const option = document.createElement("option");
            option.value = city;
            option.textContent = city;
            recentSearchesDropdown.appendChild(option);
        });
        recentSearchesDropdown.style.display = "block";
    } else {
        recentSearchesDropdown.style.display = "none";
    }
}

searchButton.addEventListener("click", getCityCoordinates);
locationButton.addEventListener("click", getUserCoordinates);
cityInput.addEventListener("keyup", e => e.key === "Enter" && getCityCoordinates());

recentSearchesDropdown.addEventListener("change", (e) => {
    const selectedCity = e.target.value;
    if (selectedCity) {
        const API_URL = `https://api.openweathermap.org/geo/1.0/direct?q=${selectedCity}&limit=1&appid=${API_KEY}`;
        fetch(API_URL).then(response => response.json()).then(data => {
            if (!data.length) {
                alert(`No coordinates found for ${selectedCity}`);
                return;
            }
            const { lat, lon, name } = data[0];
            getWeatherDetails(name, lat, lon);
        }).catch(() => {
            alert("An error occurred while fetching the coordinates!");
        });
    }
});

document.addEventListener("DOMContentLoaded", () => {
    updateRecentSearchesDropdown();
});
