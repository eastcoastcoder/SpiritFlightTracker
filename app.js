// Spirit Airlines Flight Tracker API Integration
// This script interfaces with the Spirit inflight WiFi portal API

const API_BASE_URL = 'https://www.spiritwifi.com';
const API_ENDPOINTS = {
  // Common inflight WiFi API endpoints
  flightInfo: '/api/flight/info',
  flightStatus: '/api/flight/status',
  flightData: '/api/v1/flight',
  // Alternative endpoints used by various inflight systems
  altFlightInfo: '/flight-info',
  altStatus: '/status.json',
};

let updateInterval = null;

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  console.log('Spirit Flight Tracker initialized');
  fetchFlightData();
  // Auto-refresh every 30 seconds
  updateInterval = setInterval(fetchFlightData, 30000);
});

// Main function to fetch flight data
async function fetchFlightData() {
  const statusEl = document.getElementById('status');
  const refreshBtn = document.getElementById('refresh-btn');
  const errorContainer = document.getElementById('error-container');

  statusEl.className = 'status loading';
  statusEl.textContent = 'Updating...';
  refreshBtn.disabled = true;
  errorContainer.innerHTML = '';

  // Try multiple endpoints since the exact API structure may vary
  const endpoints = [
    `${API_BASE_URL}${API_ENDPOINTS.flightInfo}`,
    `${API_BASE_URL}${API_ENDPOINTS.flightStatus}`,
    `${API_BASE_URL}${API_ENDPOINTS.flightData}`,
    `${API_BASE_URL}${API_ENDPOINTS.altFlightInfo}`,
    `${API_BASE_URL}${API_ENDPOINTS.altStatus}`,
  ];

  let dataFetched = false;

  for (const endpoint of endpoints) {
    try {
      console.log(`Attempting to fetch from: ${endpoint}`);
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
        },
        // Allow CORS for testing
        mode: 'cors',
        credentials: 'omit',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Flight data received:', data);
        updateUI(data);
        dataFetched = true;
        statusEl.className = 'status active';
        statusEl.textContent = 'Connected';
        break;
      }
    } catch (error) {
      console.log(`Failed to fetch from ${endpoint}:`, error.message);
      // Continue to next endpoint
    }
  }

  if (!dataFetched) {
    // If no real data, show demo mode or error
    if (isDevelopmentMode()) {
      showDemoData();
      statusEl.className = 'status loading';
      statusEl.textContent = 'Demo Mode';
    } else {
      showError('Unable to connect to Spirit WiFi. Make sure you are connected to the SpiritWiFi network.');
      statusEl.className = 'status error';
      statusEl.textContent = 'Not Connected';
    }
  }

  refreshBtn.disabled = false;
  updateLastRefreshTime();
}

// Update UI with flight data
function updateUI(data) {
  // Parse the data structure (may vary depending on API response)
  const flightInfo = extractFlightInfo(data);

  document.getElementById('flight-number').textContent = flightInfo.flightNumber || '--';
  document.getElementById('origin').textContent = flightInfo.origin || '--';
  document.getElementById('destination').textContent = flightInfo.destination || '--';
  document.getElementById('altitude').textContent = flightInfo.altitude || '--';
  document.getElementById('speed').textContent = flightInfo.speed || '--';
  document.getElementById('time-remaining').textContent = flightInfo.timeRemaining || '--';

  // Update progress bar
  const progress = flightInfo.progress || 0;
  const progressFill = document.getElementById('progress-fill');
  progressFill.style.width = `${progress}%`;
  progressFill.textContent = `${Math.round(progress)}%`;
}

// Extract flight information from API response
function extractFlightInfo(data) {
  // Handle different possible API response structures
  const info = {
    flightNumber: data.flightNumber || data.flight_number || data.flight || null,
    origin: data.origin || data.departure || data.from || null,
    destination: data.destination || data.arrival || data.to || null,
    altitude: formatAltitude(data.altitude || data.alt || null),
    speed: formatSpeed(data.speed || data.groundSpeed || data.ground_speed || null),
    timeRemaining: formatTime(data.timeRemaining || data.time_remaining || data.eta || null),
    progress: calculateProgress(data),
  };

  return info;
}

// Calculate flight progress percentage
function calculateProgress(data) {
  if (data.progress !== undefined) {
    return Math.min(100, Math.max(0, data.progress));
  }

  if (data.elapsed && data.duration) {
    return (data.elapsed / data.duration) * 100;
  }

  if (data.distance_traveled && data.total_distance) {
    return (data.distance_traveled / data.total_distance) * 100;
  }

  return 0;
}

// Format altitude
function formatAltitude(alt) {
  if (!alt && alt !== 0) return null;
  return `${alt.toLocaleString()} ft`;
}

// Format speed
function formatSpeed(speed) {
  if (!speed && speed !== 0) return null;
  return `${Math.round(speed)} mph`;
}

// Format time remaining
function formatTime(time) {
  if (!time) return null;

  // If time is in minutes
  if (typeof time === 'number') {
    const hours = Math.floor(time / 60);
    const minutes = Math.round(time % 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  }

  // If time is already formatted
  return time;
}

// Show error message
function showError(message) {
  const errorContainer = document.getElementById('error-container');
  errorContainer.innerHTML = `<div class="error-message">${message}</div>`;
}

// Update last refresh time
function updateLastRefreshTime() {
  const now = new Date();
  const timeString = now.toLocaleTimeString();
  document.getElementById('last-update').textContent = `Last updated: ${timeString}`;
}

// Check if running in development mode
function isDevelopmentMode() {
  return (
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === ''
  );
}

// Show demo data for testing
function showDemoData() {
  const demoData = {
    flightNumber: 'NK 123',
    origin: 'Fort Lauderdale (FLL)',
    destination: 'Los Angeles (LAX)',
    altitude: 35000,
    speed: 520,
    timeRemaining: 145, // minutes
    progress: 62,
  };

  updateUI(demoData);
  console.log('Demo data displayed');
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
});
