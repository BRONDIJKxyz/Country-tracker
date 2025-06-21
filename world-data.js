// world-data.js - Country and continent data for the World Travel Tracker

// Continent data with country assignments
const CONTINENTS = {
  "Africa": {
    id: "africa",
    color: "#FFC107",
    countries: [
      "Algeria", "Angola", "Benin", "Botswana", "Burkina Faso", "Burundi", "Cabo Verde",
      "Cameroon", "Central African Republic", "Chad", "Comoros", "Congo", "Democratic Republic of the Congo",
      "Djibouti", "Egypt", "Equatorial Guinea", "Eritrea", "Eswatini", "Ethiopia", "Gabon",
      "Gambia", "Ghana", "Guinea", "Guinea-Bissau", "Ivory Coast", "Kenya", "Lesotho",
      "Liberia", "Libya", "Madagascar", "Malawi", "Mali", "Mauritania", "Mauritius",
      "Morocco", "Mozambique", "Namibia", "Niger", "Nigeria", "Rwanda", "Sao Tome and Principe",
      "Senegal", "Seychelles", "Sierra Leone", "Somalia", "South Africa", "South Sudan", "Sudan",
      "Tanzania", "Togo", "Tunisia", "Uganda", "Zambia", "Zimbabwe"
    ]
  },
  "Asia": {
    id: "asia",
    color: "#FF5722",
    countries: [
      "Afghanistan", "Armenia", "Azerbaijan", "Bahrain", "Bangladesh", "Bhutan",
      "Brunei", "Cambodia", "China", "Cyprus", "Georgia", "India", "Indonesia", "Iran",
      "Iraq", "Israel", "Japan", "Jordan", "Kazakhstan", "Kuwait", "Kyrgyzstan", "Laos",
      "Lebanon", "Malaysia", "Maldives", "Mongolia", "Myanmar", "Nepal", "North Korea",
      "Oman", "Pakistan", "Palestine", "Philippines", "Qatar", "Saudi Arabia", "Singapore",
      "South Korea", "Sri Lanka", "Syria", "Taiwan", "Tajikistan", "Thailand", "Timor-Leste",
      "Turkey", "Turkmenistan", "United Arab Emirates", "Uzbekistan", "Vietnam", "Yemen"
    ]
  },
  "Europe": {
    id: "europe",
    color: "#2196F3",
    countries: [
      "Albania", "Andorra", "Austria", "Belarus", "Belgium", "Bosnia and Herzegovina",
      "Bulgaria", "Croatia", "Czech Republic", "Denmark", "Estonia", "Finland", "France",
      "Germany", "Greece", "Hungary", "Iceland", "Ireland", "Italy", "Kosovo", "Latvia",
      "Liechtenstein", "Lithuania", "Luxembourg", "Malta", "Moldova", "Monaco", "Montenegro",
      "Netherlands", "North Macedonia", "Norway", "Poland", "Portugal", "Romania", "Russia",
      "San Marino", "Serbia", "Slovakia", "Slovenia", "Spain", "Sweden", "Switzerland",
      "Ukraine", "United Kingdom", "Vatican City"
    ]
  },
  "North America": {
    id: "namerica",
    color: "#4CAF50",
    countries: [
      "Antigua and Barbuda", "Bahamas", "Barbados", "Belize", "Canada", "Costa Rica", "Cuba",
      "Dominica", "Dominican Republic", "El Salvador", "Grenada", "Guatemala", "Haiti",
      "Honduras", "Jamaica", "Mexico", "Nicaragua", "Panama", "Saint Kitts and Nevis",
      "Saint Lucia", "Saint Vincent and the Grenadines", "Trinidad and Tobago", "United States"
    ]
  },
  "South America": {
    id: "samerica",
    color: "#9C27B0",
    countries: [
      "Argentina", "Bolivia", "Brazil", "Chile", "Colombia", "Ecuador", "Guyana",
      "Paraguay", "Peru", "Suriname", "Uruguay", "Venezuela"
    ]
  },
  "Oceania": {
    id: "oceania",
    color: "#00BCD4",
    countries: [
      "Australia", "Fiji", "Kiribati", "Marshall Islands", "Micronesia", "Nauru",
      "New Zealand", "Palau", "Papua New Guinea", "Samoa", "Solomon Islands",
      "Tonga", "Tuvalu", "Vanuatu"
    ]
  }
};

// Create a lookup object for quick continent referencing
const COUNTRY_TO_CONTINENT = {};
Object.keys(CONTINENTS).forEach(continentName => {
  CONTINENTS[continentName].countries.forEach(country => {
    COUNTRY_TO_CONTINENT[country] = continentName;
  });
});

// Total country count
const TOTAL_COUNTRIES = Object.values(CONTINENTS).reduce(
  (total, continent) => total + continent.countries.length, 0
);

// Country name normalization map - handles differences between GeoJSON and our data
const COUNTRY_NAME_MAP = {
  // North America
  "United States of America": "United States",
  "USA": "United States",
  "U.S.A.": "United States",
  "The Bahamas": "Bahamas",
  "Dominican Rep.": "Dominican Republic",
  "Trinidad and Tob.": "Trinidad and Tobago",
  "St. Kitts and Nevis": "Saint Kitts and Nevis",
  "St. Lucia": "Saint Lucia",
  "St. Vin. and Gren.": "Saint Vincent and the Grenadines",
  
  // South America
  "Venezuela, RB": "Venezuela",
  
  // Europe
  "United Kingdom": "United Kingdom",
  "UK": "United Kingdom",
  "Bosnia and Herz.": "Bosnia and Herzegovina",
  "Czech Rep.": "Czech Republic",
  "Czech Republic": "Czech Republic",
  "Czechia": "Czech Republic",
  "Macedonia": "North Macedonia",
  "Republic of North Macedonia": "North Macedonia",
  "Slovak Republic": "Slovakia",
  "Republic of Serbia": "Serbia",
  "Vatican": "Vatican City",
  "Holy See": "Vatican City",
  "Republic of Moldova": "Moldova",
  
  // Africa
  "Congo, Dem. Rep.": "Democratic Republic of the Congo",
  "Democratic Republic of the Congo": "Democratic Republic of the Congo",
  "Congo, Rep.": "Congo",
  "Republic of the Congo": "Congo",
  "Ivory Coast": "Ivory Coast",
  "Côte d'Ivoire": "Ivory Coast",
  "Tanzania": "Tanzania",
  "United Republic of Tanzania": "Tanzania",
  "Central African Rep.": "Central African Republic",
  "Congo-Brazzaville": "Congo",
  "Congo-Kinshasa": "Democratic Republic of the Congo",
  "Cabo Verde": "Cape Verde",
  "Eswatini": "Eswatini",
  "Swaziland": "Eswatini",
  "Eq. Guinea": "Equatorial Guinea",
  "S. Sudan": "South Sudan",
  "São Tomé and Principe": "Sao Tome and Principe",
  
  // Asia
  "Myanmar": "Myanmar",
  "Myanmar (Burma)": "Myanmar",
  "Burma": "Myanmar",
  "South Korea": "South Korea",
  "Republic of Korea": "South Korea",
  "Korea, Rep.": "South Korea",
  "Korea, South": "South Korea",
  "North Korea": "North Korea",
  "Democratic People's Republic of Korea": "North Korea",
  "Korea, Dem. Rep.": "North Korea",
  "Korea, North": "North Korea",
  "Brunei Darussalam": "Brunei",
  "UAE": "United Arab Emirates",
  "Palestine": "Palestine",
  "State of Palestine": "Palestine",
  "Timor-Leste": "Timor-Leste",
  "East Timor": "Timor-Leste",
  "Lao PDR": "Laos",
  "Vietnam": "Vietnam",
  "Viet Nam": "Vietnam",
  
  // Oceania
  "Micronesia, Fed. Sts.": "Micronesia",
  "Federated States of Micronesia": "Micronesia"
};

// Export the data to global scope by assigning to window object
window.WorldData = {
  CONTINENTS,
  COUNTRY_TO_CONTINENT,
  TOTAL_COUNTRIES,
  COUNTRY_NAME_MAP
};

// Log for debugging
console.log('WorldData loaded, total countries:', TOTAL_COUNTRIES);
