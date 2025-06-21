// World Travel Tracker - Main Script
document.addEventListener('DOMContentLoaded', () => {
  // State management
  const state = {
    visitedCountries: new Set(),
    mapSVG: null,
    mapWidth: 1200,
    mapHeight: 700,
    mapTransform: { k: 1, x: 0, y: 0 }, // Zoom and pan state
    countryData: null,
    countryElements: {},
    flagMarkers: {},
    path: null, // Store path globally for access in other functions
    projection: null, // Store projection globally
    allCountries: [] // Store all countries for the list view
  };

  // Initialize the app
  initMap();

  // Event listeners for buttons
  document.getElementById('reset-button').addEventListener('click', resetMap);
  document.getElementById('done-button').addEventListener('click', showSummary);
  document.getElementById('zoom-in').addEventListener('click', () => zoomMap(1.3));
  document.getElementById('zoom-out').addEventListener('click', () => zoomMap(0.7));
  document.getElementById('reset-zoom').addEventListener('click', resetZoom);
  document.querySelector('.close-modal').addEventListener('click', closeSummary);
  document.getElementById('download-map').addEventListener('click', downloadMap);
  document.getElementById('copy-link').addEventListener('click', copyLink);
  document.getElementById('view-countries-list').addEventListener('click', showCountriesList);
  document.querySelector('.close-countries-list').addEventListener('click', closeCountriesList);

  /**
   * Initializes the interactive world map using D3.js
   */
  function initMap() {
    // Set up the map projection
    state.projection = d3.geoNaturalEarth1()
      .scale(state.mapWidth / 2 / Math.PI)
      .translate([state.mapWidth / 2, state.mapHeight / 2]);
    
    state.path = d3.geoPath().projection(state.projection);

    // Create the SVG element for the map
    const svg = d3.select('#map')
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${state.mapWidth} ${state.mapHeight}`)
      .attr('preserveAspectRatio', 'xMidYMid meet');
    
    state.mapSVG = svg;
    
    // Create a group for the map elements that can be transformed
    const mapGroup = svg.append('g');
    
    // Add zoom behavior
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        state.mapTransform = event.transform;
        mapGroup.attr('transform', event.transform);
      });
    
    svg.call(zoom);
    
    // Load the world map data
    d3.json('https://unpkg.com/world-atlas@2/countries-110m.json')
      .then(data => {
        // Convert TopoJSON to GeoJSON
        const countries = topojson.feature(data, data.objects.countries);
        state.countryData = countries;
        
        // Add countries to the map
        mapGroup.selectAll('path')
          .data(countries.features)
          .enter()
          .append('path')
          .attr('class', 'country')
          .attr('d', state.path)
          .attr('id', d => `country-${d.id}`)
          .on('mouseover', handleCountryMouseOver)
          .on('mouseout', handleCountryMouseOut)
          .on('click', handleCountryClick);
        
        // Store country elements for later reference and populate allCountries
        countries.features.forEach(feature => {
          let countryName = feature.properties.name;
          if (WorldData.COUNTRY_NAME_MAP[countryName]) {
            countryName = WorldData.COUNTRY_NAME_MAP[countryName];
          }
          
          state.countryElements[countryName] = document.getElementById(`country-${feature.id}`);
          
          // Only add to allCountries if it's in our continent data
          const continent = WorldData.COUNTRY_TO_CONTINENT[countryName];
          if (continent) {
            state.allCountries.push({
              name: countryName,
              continent: continent,
              id: feature.id,
              visited: false
            });
          }
        });
        
        // Sort countries alphabetically
        state.allCountries.sort((a, b) => a.name.localeCompare(b.name));
      })
      .catch(error => console.error('Error loading map data:', error));
    
    // Create a group for flag markers
    svg.append('g').attr('class', 'flag-markers');
  }

  /**
   * Handles mouse over event on a country
   */
  function handleCountryMouseOver(event, d) {
    // Get normalized country name
    let countryName = d.properties.name;
    if (WorldData.COUNTRY_NAME_MAP[countryName]) {
      countryName = WorldData.COUNTRY_NAME_MAP[countryName];
    }

    // Show tooltip
    const tooltip = document.getElementById('map-tooltip');
    tooltip.style.opacity = 1;
    tooltip.style.left = `${event.pageX + 10}px`;
    tooltip.style.top = `${event.pageY + 10}px`;
    tooltip.textContent = countryName;
  }

  /**
   * Handles mouse out event on a country
   */
  function handleCountryMouseOut() {
    const tooltip = document.getElementById('map-tooltip');
    tooltip.style.opacity = 0;
  }

  /**
   * Handles click event on a country
   */
  function handleCountryClick(event, d) {
    // Get normalized country name
    let countryName = d.properties.name;
    if (WorldData.COUNTRY_NAME_MAP[countryName]) {
      countryName = WorldData.COUNTRY_NAME_MAP[countryName];
    }

    console.log('Country clicked:', countryName);

    // Check if this country is in our data
    const continent = WorldData.COUNTRY_TO_CONTINENT[countryName];
    if (!continent) {
      console.warn(`Country not found in data: ${countryName}`);
      return;
    }

    // Toggle visited status
    if (state.visitedCountries.has(countryName)) {
      state.visitedCountries.delete(countryName);
      event.currentTarget.classList.remove('visited');
      
      // Remove flag marker
      if (state.flagMarkers[countryName]) {
        state.flagMarkers[countryName].remove();
        delete state.flagMarkers[countryName];
      }
      
      // Update the corresponding country in allCountries
      const countryIndex = state.allCountries.findIndex(c => c.name === countryName);
      if (countryIndex !== -1) {
        state.allCountries[countryIndex].visited = false;
      }
    } else {
      state.visitedCountries.add(countryName);
      event.currentTarget.classList.add('visited');
      
      // Add flag marker - use the stored path function from state
      const centroid = state.path.centroid(d);
      console.log('Centroid coordinates:', centroid);
      
      if (centroid.length === 2 && !isNaN(centroid[0]) && !isNaN(centroid[1])) {
        const flag = state.mapSVG.select('.flag-markers')
          .append('text')
          .attr('class', 'flag-marker')
          .attr('x', centroid[0])
          .attr('y', centroid[1])
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('font-size', '18px')
          .text('🏁');
        
        state.flagMarkers[countryName] = flag.node();
      }
      
      // Update the corresponding country in allCountries
      const countryIndex = state.allCountries.findIndex(c => c.name === countryName);
      if (countryIndex !== -1) {
        state.allCountries[countryIndex].visited = true;
      }
    }

    // Update statistics
    updateStats();
    console.log('Visited countries:', state.visitedCountries.size);
  }

  /**
   * Updates all statistics based on visited countries
   */
  function updateStats() {
    const visitedCount = state.visitedCountries.size;
    
    // Verify we have access to the WorldData object
    if (!window.WorldData || !WorldData.TOTAL_COUNTRIES) {
      console.error('WorldData is not properly defined:', WorldData);
      return;
    }
    
    const globalPercent = Math.round((visitedCount / WorldData.TOTAL_COUNTRIES) * 100) || 0;
    
    console.log('Updating stats:', visitedCount, 'countries,', globalPercent + '%');
    
    // Update global stats - ensure this happens immediately
    requestAnimationFrame(() => {
      document.getElementById('countries-visited').textContent = visitedCount;
      document.getElementById('global-percent').textContent = `${globalPercent}%`;
    });
    
    // Update continent stats
    Object.keys(WorldData.CONTINENTS).forEach(continentName => {
      const continent = WorldData.CONTINENTS[continentName];
      const continentTotal = continent.countries.length;
      const continentVisited = continent.countries.filter(country => 
        state.visitedCountries.has(country)
      ).length;
      
      const continentPercent = continentTotal > 0 
        ? Math.round((continentVisited / continentTotal) * 100)
        : 0;
      
      const progressBar = document.getElementById(`${continent.id}-progress`);
      progressBar.style.width = `${continentPercent}%`;
      progressBar.textContent = `${continentPercent}%`;
    });
  }

  /**
   * Resets the map, clearing all visited countries
   */
  function resetMap() {
    state.visitedCountries.clear();
    
    // Reset country styling
    document.querySelectorAll('.country').forEach(country => {
      country.classList.remove('visited');
    });
    
    // Remove all flag markers
    state.mapSVG.select('.flag-markers').selectAll('*').remove();
    state.flagMarkers = {};
    
    // Reset statistics
    updateStats();
  }

  /**
   * Shows the summary modal with final statistics
   */
  function showSummary() {
    if (state.visitedCountries.size === 0) {
      alert('You haven\'t visited any countries yet. Mark some countries before generating your summary.');
      return;
    }
    
    // Create a copy of the map for the summary
    const summaryMap = document.getElementById('summary-map');
    summaryMap.innerHTML = '';
    
    const svgCopy = state.mapSVG.node().cloneNode(true);
    summaryMap.appendChild(svgCopy);
    
    // Update summary stats
    const visitedCount = state.visitedCountries.size;
    const globalPercent = Math.round((visitedCount / WorldData.TOTAL_COUNTRIES) * 100);
    
    document.getElementById('summary-countries').textContent = `${visitedCount} of ${WorldData.TOTAL_COUNTRIES}`;
    document.getElementById('summary-percent').textContent = `${globalPercent}%`;
    
    // Update continent stats in summary
    const continentStatsContainer = document.getElementById('summary-continent-stats');
    continentStatsContainer.innerHTML = '';
    
    Object.keys(WorldData.CONTINENTS).forEach(continentName => {
      const continent = WorldData.CONTINENTS[continentName];
      const continentTotal = continent.countries.length;
      const continentVisited = continent.countries.filter(country => 
        state.visitedCountries.has(country)
      ).length;
      
      const continentPercent = continentTotal > 0 
        ? Math.round((continentVisited / continentTotal) * 100)
        : 0;
      
      const continentElement = document.createElement('div');
      continentElement.classList.add('summary-continent-item');
      continentElement.innerHTML = `
        <div class="continent-name">${continentName}</div>
        <div class="continent-value">${continentPercent}%</div>
      `;
      
      // Add background color based on continent
      continentElement.style.backgroundColor = continent.color + '33'; // 33 is 20% opacity in hex
      
      continentStatsContainer.appendChild(continentElement);
    });
    
    // Show the modal
    document.getElementById('summary-modal').style.display = 'block';
  }

  /**
   * Closes the summary modal
   */
  function closeSummary() {
    document.getElementById('summary-modal').style.display = 'none';
  }

  /**
   * Zooms the map by the given factor
   */
  function zoomMap(factor) {
    const zoom = d3.zoom().scaleExtent([1, 8]);
    
    const newK = state.mapTransform.k * factor;
    if (newK < 1 || newK > 8) return; // Respect zoom limits
    
    const transform = d3.zoomIdentity
      .translate(state.mapTransform.x, state.mapTransform.y)
      .scale(newK);
    
    state.mapSVG
      .transition()
      .duration(300)
      .call(zoom.transform, transform);
  }

  /**
   * Resets the map zoom to initial state
   */
  function resetZoom() {
    const zoom = d3.zoom().scaleExtent([1, 8]);
    state.mapSVG
      .transition()
      .duration(300)
      .call(zoom.transform, d3.zoomIdentity);
  }

  /**
   * Downloads the summary map as an image
   */
  function downloadMap() {
    const summaryContainer = document.querySelector('.modal-content');
    
    html2canvas(summaryContainer, { 
      backgroundColor: '#ffffff',
      scale: 2 // Higher quality
    }).then(canvas => {
      const link = document.createElement('a');
      link.download = 'my-travel-footprint.png';
      link.href = canvas.toDataURL('image/png');
      link.click();
    });
  }

  /**
   * Generates and copies a shareable link
   */
  function copyLink() {
    // For simplicity, we'll just encode visited countries in a URL parameter
    // In a real app, you would use a backend to generate sharing links
    const visitedArray = Array.from(state.visitedCountries);
    const visitedParam = encodeURIComponent(JSON.stringify(visitedArray));
    
    const url = `${window.location.origin}${window.location.pathname}?visited=${visitedParam}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(url)
      .then(() => {
        alert('Link copied to clipboard!');
      })
      .catch(() => {
        alert('Failed to copy link. Your browser may not support this feature.');
      });
  }

  /**
   * Checks URL for shared data and loads it if present
   */
  function checkForSharedData() {
    const urlParams = new URLSearchParams(window.location.search);
    const visitedParam = urlParams.get('visited');
    
    if (visitedParam) {
      try {
        const visitedArray = JSON.parse(decodeURIComponent(visitedParam));
        
        // Wait for the map to load before applying visited countries
        const checkMapLoaded = setInterval(() => {
          if (state.countryData) {
            clearInterval(checkMapLoaded);
            
            // Mark countries as visited
            visitedArray.forEach(countryName => {
              const feature = state.countryData.features.find(f => {
                let name = f.properties.name;
                if (WorldData.COUNTRY_NAME_MAP[name]) {
                  name = WorldData.COUNTRY_NAME_MAP[name];
                }
                return name === countryName;
              });
              
              if (feature) {
                const country = document.getElementById(`country-${feature.id}`);
                if (country) {
                  country.classList.add('visited');
                  state.visitedCountries.add(countryName);
                  
                  // Add flag marker
                  // Use the stored path function
                  const centroid = state.path.centroid(feature);
                  if (centroid.length === 2 && !isNaN(centroid[0]) && !isNaN(centroid[1])) {
                    const flag = state.mapSVG.select('.flag-markers')
                      .append('text')
                      .attr('class', 'flag-marker')
                      .attr('x', centroid[0])
                      .attr('y', centroid[1])
                      .attr('text-anchor', 'middle')
                      .attr('dominant-baseline', 'central')
                      .attr('font-size', '14px')
                      .text('🚩');
                    
                    state.flagMarkers[countryName] = flag.node();
                  }
                }
              }
            });
            
            updateStats();
          }
        }, 100);
      } catch (error) {
        console.error('Error parsing shared data:', error);
      }
    }
  }

  // Check for shared data when page loads
  checkForSharedData();
  
  /**
   * Shows the countries list modal
   */
  function showCountriesList() {
    // Populate the countries list
    const countriesList = document.getElementById('countries-list-container');
    countriesList.innerHTML = '';
    
    // Group countries by continent
    const continentGroups = {};
    Object.keys(WorldData.CONTINENTS).forEach(continent => {
      continentGroups[continent] = [];
    });
    
    state.allCountries.forEach(country => {
      if (continentGroups[country.continent]) {
        continentGroups[country.continent].push(country);
      }
    });
    
    // Create continent sections
    Object.keys(continentGroups).forEach(continent => {
      const continentSection = document.createElement('div');
      continentSection.className = 'continent-section';
      
      const continentHeader = document.createElement('h3');
      continentHeader.textContent = continent;
      continentHeader.style.color = WorldData.CONTINENTS[continent].color;
      continentSection.appendChild(continentHeader);
      
      const countriesGrid = document.createElement('div');
      countriesGrid.className = 'countries-grid';
      
      continentGroups[continent].forEach(country => {
        const countryItem = document.createElement('div');
        countryItem.className = 'country-item';
        if (country.visited) {
          countryItem.classList.add('visited');
        }
        
        const countryName = document.createElement('span');
        countryName.textContent = country.name;
        
        const countryStatus = document.createElement('span');
        countryStatus.className = 'country-status';
        countryStatus.textContent = country.visited ? '🏁 Visited' : '⬜ Not visited';
        
        countryItem.appendChild(countryName);
        countryItem.appendChild(countryStatus);
        
        // Add click handler to toggle visited status from the list
        countryItem.addEventListener('click', () => {
          const mapCountry = state.countryData.features.find(f => {
            let name = f.properties.name;
            if (WorldData.COUNTRY_NAME_MAP[name]) {
              name = WorldData.COUNTRY_NAME_MAP[name];
            }
            return name === country.name;
          });
          
          if (mapCountry) {
            const countryElement = document.getElementById(`country-${mapCountry.id}`);
            if (countryElement) {
              // Simulate click on the map
              const event = new MouseEvent('click');
              countryElement.dispatchEvent(event);
              
              // Update the list item
              countryItem.classList.toggle('visited');
              countryStatus.textContent = country.visited ? '🏁 Visited' : '⬜ Not visited';
            }
          }
        });
        
        countriesGrid.appendChild(countryItem);
      });
      
      continentSection.appendChild(countriesGrid);
      countriesList.appendChild(continentSection);
    });
    
    // Show the modal
    document.getElementById('countries-list-modal').style.display = 'block';
  }
  
  /**
   * Closes the countries list modal
   */
  function closeCountriesList() {
    document.getElementById('countries-list-modal').style.display = 'none';
  }
});
