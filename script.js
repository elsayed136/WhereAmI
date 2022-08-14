'use strict';

/**************************/
/* VARIABLES  */
/**************************/
const API_KEY = `962fa9c4f3954a0ea2d47bf664f6b2c0`;
const GEOAPIFY_URL = `https://api.geoapify.com/v1/geocode/reverse`;

const REST_COUNTRY_API_URL = `https://restcountries.com/v3.1`;

const btn = document.querySelector('.btn--country');
const searchBtn = document.querySelector('.btn--search');
const countryInput = document.querySelector('#country-input');
const countriesContainer = document.querySelector('.countries');

const autocompleteWrapper = document.querySelector('.autocomplete__wrapper');

let countryNames = [];

/**************************/
/* FUNCTIONS  */
/**************************/
const renderCountry = function (data, className = '') {
  const { flags, name, region, population, languages, currencies } = data;
  const html = `
    <article class="country ${className}">
      <img class="country__img" src="${flags.png}" />
      <div class="country__data">
        <h3 class="country__name">${name.common}</h3>
        <h4 class="country__region">${region}</h4>
        <p class="country__row"><span>👫</span>${(
          +population / 1000000
        ).toFixed(1)} people</p>
        <p class="country__row"><span>🗣️</span>${
          Object.values(languages)[0]
        }</p>
        <p class="country__row"><span>💰</span>${
          Object.values(currencies)[0].name
        }</p>
      </div>
    </article>
  `;
  countriesContainer.insertAdjacentHTML('beforeend', html);
  countriesContainer.style.opacity = 1;
};

const renderError = function (msg) {
  // countriesContainer.innerHTML = '';
  countriesContainer.insertAdjacentText('beforeend', msg);
  countriesContainer.style.opacity = 1;
};

const getJSON = function (url, errorMsg = 'Something went wrong') {
  return fetch(url).then(response => {
    console.log(response);
    if (!response.ok) throw new Error(`${errorMsg} (${response.status})`);

    return response.json();
  });
};

const getCountryData = function (country) {
  // clear countriesContainer for each request
  countriesContainer.innerHTML = '';

  // Country 1
  getJSON(`${REST_COUNTRY_API_URL}/name/${country}`, 'Country not found')
    .then(([data]) => {
      renderCountry(data);

      let [neighbor] = data?.borders ?? [];

      if (neighbor === 'ISR') neighbor = 'PSE';

      if (!neighbor) throw new Error('No neighbour found!');

      // Country 2
      return getJSON(
        `${REST_COUNTRY_API_URL}/alpha/${neighbor}`,
        'Country not found'
      );
    })

    .then(([data]) => renderCountry(data, 'neighbor'))
    .catch(err => {
      console.error(`${err} 💥💥💥`);
      renderError(`Something went wrong 💥💥 ${err.message}. Try again!`);
    });
};

const getPosition = function () {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });
};

const whereAmI = function () {
  getPosition()
    .then(pos => {
      const { latitude: lat, longitude: lon } = pos.coords;

      return getJSON(
        `${GEOAPIFY_URL}?lat=${lat}&lon=${lon}&apiKey=${API_KEY}`,
        `Problem with geocoding`
      );
    })
    .then(data => {
      const {
        features: [
          {
            properties: { country },
          },
        ],
      } = data;

      return getCountryData(country);
    });
};

const getCountriesData = async function () {
  const data = await getJSON(`${REST_COUNTRY_API_URL}/all`);
  countryNames = data.map(country => country.name.common).sort();
};

const onInputHandler = function (e) {
  removeAutocompleteDropdown();

  const value = e.target.value.toLowerCase();

  if (value.length === 0) return;

  const filteredNames = countryNames.filter(
    country => country.substring(0, value.length).toLowerCase() === value
  );

  creatAutocompleteDropdown(filteredNames);
};

const removeAutocompleteDropdown = function () {
  const listEL = document.querySelector('#autocomplete-list');
  if (listEL) listEL.remove();
};

const creatAutocompleteDropdown = function (list) {
  const listEl = document.createElement('ul');
  listEl.classList.add('autocomplete-list');
  listEl.id = 'autocomplete-list';

  list.forEach(country => {
    const listItem = document.createElement('li');
    const listCountryBtn = document.createElement('button');

    listCountryBtn.textContent = country;

    listCountryBtn.addEventListener('click', onCountryClick);

    listItem.appendChild(listCountryBtn);
    listEl.appendChild(listItem);
  });

  autocompleteWrapper.insertAdjacentElement('beforeend', listEl);
};

const onCountryClick = function (e) {
  const value = e.target.textContent;

  countryInput.value = value;

  removeAutocompleteDropdown();
};

const onSearchHandler = function (e) {
  e.preventDefault();

  const value = countryInput.value.toLowerCase();

  getCountryData(value);

  countryInput.value = '';
};

/**************************/
/* APP  */
/**************************/
getCountriesData();

btn.addEventListener('click', whereAmI);
countryInput.addEventListener('input', onInputHandler);
searchBtn.addEventListener('click', onSearchHandler);
