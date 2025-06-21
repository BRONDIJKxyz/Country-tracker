// World Travel Tracker - Main Script
document.addEventListener('DOMContentLoaded', () => {
  // State management
  const state = {
    visitedCountries: new Set(),
    mapSVG: null,
    mapWidth: 960,
    mapHeight: 500,
    mapTransform: { k: 1, x: 0, y: 0 }, // Zoom and pan state
    countryData: null,
    countryElements: {},
    flagMarkers: {}
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

  /**
   * Initializes the interactive world map using D3.js
   */
  function initMap() {
    // Set up the map projection
    const projection = d3.geoNaturalEarth1()
      .scale(state.mapWidth / 2 / Math.PI)
      .translate([state.mapWidth / 2, state.mapHeight / 2]);
    
    const path = d3.geoPath().projection(projection);

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
          .attr('d', path)
          .attr('id', d => `country-${d.id}`)
          .on('mouseover', handleCountryMouseOver)
          .on('mouseout', handleCountryMouseOut)
          .on('click', handleCountryClick);
        
        // Store country elements for later reference
        countries.features.forEach(feature => {
          const countryName = feature.properties.name;
          state.countryElements[countryName] = document.getElementById(`country-${feature.id}`);
        });
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
    } else {
      state.visitedCountries.add(countryName);
      event.currentTarget.classList.add('visited');
      
      // Add flag marker
      const centroid = path.centroid(d);
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

    // Update statistics
    updateStats();
  }

  /**
   * Updates all statistics based on visited countries
   */
  function updateStats() {
    const visitedCount = state.visitedCountries.size;
    const globalPercent = Math.round((visitedCount / WorldData.TOTAL_COUNTRIES) * 100);
    
    // Update global stats
    document.getElementById('countries-visited').textContent = visitedCount;
    document.getElementById('global-percent').textContent = `${globalPercent}%`;
    
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
                  const path = d3.geoPath().projection(
                    d3.geoNaturalEarth1()
                      .scale(state.mapWidth / 2 / Math.PI)
                      .translate([state.mapWidth / 2, state.mapHeight / 2])
                  );
                  
                  const centroid = path.centroid(feature);
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
});
