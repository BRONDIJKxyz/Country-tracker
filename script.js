// World Travel Tracker - Main Script
document.addEventListener('DOMContentLoaded', () => {
  // State management
  const state = {
    visitedCountries: new Set(),
    flagMarkers: {},
    countryElements: {},
    allCountries: [],
    mapTransform: { k: 1, x: 0, y: 0 }, // Zoom and pan state
    mapWidth: 960,
    mapHeight: 480,
    mapSVG: null,
    mapGroup: null,
    projection: null,
    path: null,
    countries: null,
    countryData: null
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
  function drawMap() {
    // Using a global variable to store our SVG element
    state.mapSVG = d3.select('#map-container')
      .append('svg')
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', [0, 0, 960, 480])
      .attr('preserveAspectRatio', 'xMinYMin meet');

    // Create a group for the zoom transform
    state.mapGroup = state.mapSVG.append('g');
    
    // Create a layer for flag markers
    state.mapGroup.append('g')
      .attr('class', 'flag-markers');

    // Define the projection
    state.projection = d3.geoNaturalEarth1()
      .scale(153)
      .translate([480, 240]);

    // Store the path generator in the state for later use
    state.path = d3.geoPath().projection(state.projection);

    // Set up zoom functionality
    setupZoom();

    // Load world topology data
    d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json')
      .then(world => {
        // Convert TopoJSON to GeoJSON
        const countries = topojson.feature(world, world.objects.countries);

        // Track unrecognized countries for debugging
        const unrecognizedCountries = [];
        
        // Process country features to ensure they have proper metadata
        const processedFeatures = countries.features.map(feature => {
          // Store original name for debugging
          feature.properties.originalName = feature.properties.name;
          
          // Normalize country name
          let countryName = feature.properties.name;
          if (WorldData.COUNTRY_NAME_MAP[countryName]) {
            countryName = WorldData.COUNTRY_NAME_MAP[countryName];
            feature.properties.name = countryName;
          }
          
          // Validate if the country exists in our data
          const continent = WorldData.COUNTRY_TO_CONTINENT[countryName];
          if (!continent) {
            unrecognizedCountries.push(countryName);
          }
          
          // Add continent info to feature properties for filtering
          feature.properties.continent = continent || 'Unknown';
          return feature;
        });

        // Log unrecognized countries so we can update our mapping
        if (unrecognizedCountries.length > 0) {
          console.log('Unrecognized countries:', unrecognizedCountries);
        }

        // Draw country paths
        state.countries = state.mapGroup
          .append('g')
          .attr('class', 'countries')
          .selectAll('path')
          .data(processedFeatures)
          .join('path')
          .attr('class', d => {
            const classes = ['country'];
            const slugName = d.properties.name.replace(/[\s,'().]/g, '-').toLowerCase();
            classes.push(slugName);
            return classes.join(' ');
          })
          .attr('data-name', d => d.properties.name)
          .attr('data-original-name', d => d.properties.originalName)
          .attr('data-continent', d => d.properties.continent)
          .attr('d', state.path)
          .attr('fill', '#e9e9e9')
          .attr('stroke', '#fff')
          .attr('stroke-width', 0.5)
          .attr('cursor', d => WorldData.COUNTRY_TO_CONTINENT[d.properties.name] ? 'pointer' : 'default')
          .on('mouseover', function(event, d) {
            // Tooltip with country name
            const countryName = d.properties.name;
            // Only show hover effect if country is recognized and not visited
            if (WorldData.COUNTRY_TO_CONTINENT[countryName] && !d3.select(this).classed('visited')) {
              d3.select(this).attr('fill', '#d9d9d9');
            }
          })
          .on('mouseout', function(event, d) {
            const countryName = d.properties.name;
            if (WorldData.COUNTRY_TO_CONTINENT[countryName] && !d3.select(this).classed('visited')) {
              d3.select(this).attr('fill', '#e9e9e9');
            }
          })
          .on('click', handleCountryClick);

        // Store country elements for later reference and populate allCountries
        processedFeatures.forEach(feature => {
          let countryName = feature.properties.name;
          if (WorldData.COUNTRY_NAME_MAP[countryName]) {
            countryName = WorldData.COUNTRY_NAME_MAP[countryName];
          }
          
          state.countryElements[countryName] = document.querySelector(`[data-name="${countryName}"]`);
          
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
      // Use bounds to find a better position for the flag
      const bounds = state.path.bounds(d);
      const centroid = [
        (bounds[0][0] + bounds[1][0]) / 2,  // x-center
        (bounds[0][1] + bounds[1][1]) / 2   // y-center
      ];
      
      console.log('Flag position for', countryName, ':', centroid);
      
      if (centroid.length === 2 && !isNaN(centroid[0]) && !isNaN(centroid[1])) {
        // Adjust flag size based on country size
        const width = Math.abs(bounds[1][0] - bounds[0][0]);
        const height = Math.abs(bounds[1][1] - bounds[0][1]);
        const area = width * height;
        const flagSize = Math.max(12, Math.min(20, Math.log2(area) * 1.5));
        
        // Create a marker group with both flag and highlight
        const markerGroup = state.mapSVG.select('.flag-markers')
          .append('g')
          .attr('class', 'flag-marker-group');
        
        // Add highlight circle behind flag
        markerGroup.append('circle')
          .attr('cx', centroid[0])
          .attr('cy', centroid[1])
          .attr('r', flagSize / 2 + 2)
          .attr('fill', 'white')
          .attr('stroke', '#e63946')
          .attr('stroke-width', 1.5);
        
        // Add flag emoji
        const flag = markerGroup.append('text')
          .attr('class', 'flag-marker')
          .attr('x', centroid[0])
          .attr('y', centroid[1])
          .attr('text-anchor', 'middle')
          .attr('dominant-baseline', 'central')
          .attr('font-size', `${flagSize}px`)
          .text('🏁');
        
        state.flagMarkers[countryName] = markerGroup.node();
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
   * Adds zoom behavior to the map
   */
  function setupZoom() {
    const zoom = d3.zoom()
      .scaleExtent([1, 8])
      .on('zoom', (event) => {
        state.mapTransform = event.transform;
        state.mapGroup.attr('transform', event.transform);
      });
    
    state.mapSVG.call(zoom);
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
          if (state.countries) {
            clearInterval(checkMapLoaded);
            
            // Mark countries as visited
            visitedArray.forEach(countryName => {
              // Find the country element
              const countryElement = d3.select(`[data-name="${countryName}"]`);
              
              if (!countryElement.empty()) {
                // Get the data object for this country
                const countryData = countryElement.datum();
                
                // Add to visited set
                state.visitedCountries.add(countryName);
                
                // Update styling
                countryElement.classed('visited', true);
                countryElement.attr('fill', '#c5e0f0');
                
                // Add flag marker using the same code as in handleCountryClick
                const bounds = state.path.bounds(countryData);
                const centroid = [
                  (bounds[0][0] + bounds[1][0]) / 2,
                  (bounds[0][1] + bounds[1][1]) / 2
                ];
                
                if (centroid.length === 2 && !isNaN(centroid[0]) && !isNaN(centroid[1])) {
                  // Similar flag marker creation as in handleCountryClick
                  const width = Math.abs(bounds[1][0] - bounds[0][0]);
                  const height = Math.abs(bounds[1][1] - bounds[0][1]);
                  const area = width * height;
                  const flagSize = Math.max(12, Math.min(20, Math.log2(area) * 1.5));
                  
                  const markerGroup = state.mapSVG.select('.flag-markers')
                    .append('g')
                    .attr('class', 'flag-marker-group');
                  
                  markerGroup.append('circle')
                    .attr('cx', centroid[0])
                    .attr('cy', centroid[1])
                    .attr('r', flagSize / 2 + 2)
                    .attr('fill', 'white')
                    .attr('stroke', '#e63946')
                    .attr('stroke-width', 1.5);
                  
                  const flag = markerGroup.append('text')
                    .attr('class', 'flag-marker')
                    .attr('x', centroid[0])
                    .attr('y', centroid[1])
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'central')
                    .attr('font-size', `${flagSize}px`)
                    .text('🏁');
                  
                  state.flagMarkers[countryName] = markerGroup.node();
                }
                
                // Update the corresponding country in allCountries list
                const countryInList = state.allCountries.find(country => country.name === countryName);
                if (countryInList) {
                  countryInList.visited = true;
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

  // Initialize the application
  function initApp() {
    // Draw the world map
    drawMap();
    
    // Add event listeners for controls
    document.getElementById('zoom-in').addEventListener('click', () => zoomMap(1.2));
    document.getElementById('zoom-out').addEventListener('click', () => zoomMap(0.8));
    document.getElementById('reset-zoom').addEventListener('click', resetZoom);
    document.getElementById('reset-button').addEventListener('click', resetMap);
    document.getElementById('done-button').addEventListener('click', showSummary);
    document.getElementById('view-countries-list').addEventListener('click', showCountriesList);
    
    // Close modals when clicking on X or outside
    document.querySelector('.close-modal').addEventListener('click', closeSummary);
    document.querySelector('.close-countries-list').addEventListener('click', closeCountriesList);
    
    // Handle summary modal actions
    document.getElementById('download-map').addEventListener('click', downloadMap);
    document.getElementById('copy-link').addEventListener('click', copyLink);
    
    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
      const summaryModal = document.getElementById('summary-modal');
      const countriesModal = document.getElementById('countries-list-modal');
      if (event.target === summaryModal) {
        closeSummary();
      }
      if (event.target === countriesModal) {
        closeCountriesList();
      }
    });
    
    // Check for shared data when page loads
    checkForSharedData();
  }
  
  // Initialize the app
  initApp();
  
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
    
    // Sort countries by name within each continent
    state.allCountries.forEach(country => {
      if (continentGroups[country.continent]) {
        continentGroups[country.continent].push(country);
      }
    });
    
    // Sort each continent's countries alphabetically
    Object.keys(continentGroups).forEach(continent => {
      continentGroups[continent].sort((a, b) => a.name.localeCompare(b.name));
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
        countryItem.dataset.countryName = country.name;
        
        if (state.visitedCountries.has(country.name)) {
          countryItem.classList.add('visited');
        }
        
        const countryName = document.createElement('span');
        countryName.textContent = country.name;
        
        const countryStatus = document.createElement('span');
        countryStatus.className = 'country-status';
        countryStatus.textContent = state.visitedCountries.has(country.name) ? '🏁 Visited' : '⬜ Not visited';
        
        countryItem.appendChild(countryName);
        countryItem.appendChild(countryStatus);
        
        // Add click handler to toggle visited status from the list
        countryItem.addEventListener('click', () => {
          // Find the country element on the map
          const countryElement = d3.select(`[data-name="${country.name}"]`);
          
          if (!countryElement.empty()) {
            // Get the data object
            const countryData = countryElement.datum();
            
            // Create a synthetic click event to leverage the existing click handler
            const clickEvent = { currentTarget: countryElement.node() };
            handleCountryClick(clickEvent, countryData);
            
            // Update the list item
            const isVisited = state.visitedCountries.has(country.name);
            countryItem.classList.toggle('visited', isVisited);
            countryStatus.textContent = isVisited ? '🏁 Visited' : '⬜ Not visited';
          } else {
            console.warn(`Country element not found for: ${country.name}`);
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
