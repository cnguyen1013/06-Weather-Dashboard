
const apiKey = "818f28f3aaf1cb71367192e664fdef1c";
const searchFormEl = document.querySelector("#search-form");
const fiveDayDiv = document.querySelector('.fiveDay .row');
const cityEl = document.querySelector("#city");
const dateEl = document.querySelector("#date");
const weatherIconEl = document.querySelector("#weather-icon");
const temperatureEl = document.querySelector("#temperature");
const windEl = document.querySelector("#wind");
const humidityEl = document.querySelector("#humidity");
const cityListDiv = document.querySelector(".cityList");

let offsetClass;

const options = {
    month: 'numeric',
    day: 'numeric',
    year: 'numeric'
};

document.addEventListener("DOMContentLoaded", function () {

    const houstonURL = buildURLFromInputs("Houston");
    searchWeather(houstonURL);

    let saved_searches = JSON.parse(localStorage.getItem("saved_cities")) || [];

    if (saved_searches) {
        generate_prev_searches(saved_searches)
    }
});

function buildURLFromInputs(city) {
    if (city) {
        return `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;
    }
}

function save_searches(city) {

    let saved_cities = JSON.parse(localStorage.getItem("saved_cities")) || [];
    let searchObj = {city};
    
    saved_cities.push(searchObj);
  
    localStorage.setItem("saved_cities", JSON.stringify(saved_cities));
}

function generate_prev_searches(data) {

    city_names = [];

    for (let i = Math.max(data.length - 5, 0); i < data.length; i++) {
        city_names.push(data[i].city);
    }

    cityListDiv.innerHTML = "";

    for (let i = 0; i < city_names.length; i++) {
        const existingButton = document.querySelector("#search-btn-" + (data.length - i - 1));
        if (!existingButton) {
            const button = document.createElement("button");
            button.classList.add("btn", "btn-primary", "btn-block", "mb-2", "align-text-bottom", "w-100");
            button.setAttribute("id", "search-btn-" + (data.length - i - 1));
            button.textContent = city_names[i] + " ";
            cityListDiv.appendChild(button);

            button.addEventListener('click', function () {
                city_URL = buildURLFromInputs(city_names[i]);
                searchWeather(city_URL);
            });
        }
    }
}

function generate_containers(data) {

    let dataArray = [];

    for (let i = 0; i < data.list.length; i++) {
        if (data.list[i].dt_txt.includes("12:00:00")) {
            dataArray.push(data.list[i]);
        }
    }

    let fiveDayHtml = '';
    for (let i = 0; i < 5; i++) {

        const unixTimeDaily = dataArray[i].dt;
        const dateObjDaily = new Date(unixTimeDaily * 1000);
        const dateTimeStringDaily = dateObjDaily.toLocaleString('en-US', options);

        const weatherIconDaily = dataArray[i].weather[0].icon;
        const weatherDescDaily = dataArray[i].weather[0].description; 
        const weatherIconUrlDaily = `http://openweathermap.org/img/wn/${weatherIconDaily}.png`;

        const tempDaily = (((dataArray[i].main.temp - 273.15) * 9/5) + 32).toFixed(1);
        const humidityDaily = dataArray[i].main.humidity

        if (i === 0) {
            offsetClass = 'offset-lg-1';
        } else {
            offsetClass = '';
        }

        fiveDayHtml += `
                <div class="col-sm-10 col-md-6 ${offsetClass} col-lg-2 p-1">
                    <div class="card day-${i} m-0 text-center">
                        <div class="card-body p-1">
                        <p class="card-title">${dateTimeStringDaily}</p>
                        <img class="fiveDay-img mb-2" src="${weatherIconUrlDaily}" alt="${weatherDescDaily}"/>
                        <p class="card-subtitle mb-2 text-muted">Temp: <span
                            class="fiveDay-temp">${tempDaily}</span>
                            &deg;F</p>
                        <p class="card-subtitle mb-2 text-muted">Humidity: <span
                            class="fiveDay-humid"></span>${humidityDaily}%</p>
                        </div>
                    </div>
                </div>
            `;
    }
    fiveDayDiv.innerHTML = fiveDayHtml;
}

function searchWeather(queryURL) {

    fetch(queryURL)
    .then(function (response) {
        if (response.ok) {
        console.log(response);
        response.json().then(function (data) {
            console.log(data);
            cityEl.textContent = data.name;

            const unixTime = data.dt;
            const timezoneOffset = data.timezone;
            const dstOffset = new Date().getTimezoneOffset() * 60;
            const localTimestamp = unixTime + timezoneOffset + dstOffset;

            const date = new Date(localTimestamp * 1000);
            const localTime = date.toLocaleTimeString();
            dateEl.textContent = localTime;

            const weatherIcon = data.weather[0].icon;
            weatherIconEl.setAttribute('src', `http://openweathermap.org/img/wn/${weatherIcon}.png`);
            weatherIconEl.setAttribute('alt', data.weather[0].description);
            
            const temperatureFahrenheit = (((data.main.temp - 273.15) * 9/5) + 32).toFixed(1);
            temperatureEl.textContent = temperatureFahrenheit;

            windEl.textContent = (data.wind.speed * 2.237).toFixed(1);

            humidityEl.textContent = data.main.humidity;

            let lat = data.coord.lat;
            let lon = data.coord.lon;

            let dailyURL = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}`;

            fetch(dailyURL)
            .then(function(response) {
                if (response.ok) {
                    console.log(response);
                    response.json().then(function (data) {
                        console.log(data);
                        generate_containers(data);
                    })
                } else {
                    alert('Error: ' + response.statusText)
                }
            })
        });
        } else {
            alert('Error: ' + response.statusText);
        }
    })
    .catch(function (error) {
        alert('Unable to connect');
    });
}

function handleSearchFormSubmit(event) {

    event.preventDefault();
    
    var searchInputVal = document.querySelector('#city-input').value;

    if (searchInputVal) {
        let queryURL = buildURLFromInputs(searchInputVal);
        save_searches(searchInputVal);
        searchWeather(queryURL);
    }

    let saved_searches = JSON.parse(localStorage.getItem("saved_cities")) || [];

    if (saved_searches) {
        generate_prev_searches(saved_searches);
    }
    document.querySelector('#city-input').value = '';
};

searchFormEl.addEventListener('submit', handleSearchFormSubmit);
