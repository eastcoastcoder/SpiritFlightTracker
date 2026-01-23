// Multi-Airline Flight Tracker API Integration
// This script interfaces with various airline inflight WiFi portal APIs

// Airline configurations
const AIRLINE_CONFIGS = {
  spirit: {
    name: 'Spirit Airlines',
    logo: '✈️ Spirit Airlines',
    baseUrl: 'https://www.spiritwifi.com',
    endpoints: {
      flightInfo: '/api/flight/info',
      flightStatus: '/api/flight/status',
      flightData: '/api/v1/flight',
      altFlightInfo: '/flight-info',
      altStatus: '/status.json',
    },
    colors: {
      primary: '#FFD100',
      secondary: '#FFA500',
    },
  },
  american: {
    name: 'American Airlines',
    logo: '🦅 American Airlines',
    baseUrl: 'https://www.aainflight.com',
    endpoints: {
      flightInfo: '/api/flight/current',
      flightStatus: '/api/flight/status',
      flightData: '/api/v1/flight-data',
      altFlightInfo: '/flight',
      altStatus: '/status',
    },
    colors: {
      primary: '#CC0000',
      secondary: '#0033AA',
    },
  },
  delta: {
    name: 'Delta Air Lines',
    logo: '🔺 Delta Air Lines',
    baseUrl: 'https://www.wifi.delta.com',
    endpoints: {
      flightInfo: '/api/flight/info',
      flightStatus: '/api/flight/status',
      flightData: '/api/v1/flight',
      altFlightInfo: '/flight-details',
      altStatus: '/flight-status.json',
    },
    colors: {
      primary: '#003366',
      secondary: '#CE1126',
    },
  },
};

let currentAirline = 'spirit';
let updateInterval = null;
let isOnline = navigator.onLine;
let installPromptEvent = null;

// PWA Installation and Service Worker Registration
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    registerServiceWorker();
  });
}

// Register service worker
async function registerServiceWorker() {
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    console.log('Service Worker registered successfully:', registration.scope);

    // Listen for service worker messages
    navigator.serviceWorker.addEventListener('message', handleServiceWorkerMessage);

    // Register for background sync
    if ('sync' in window.ServiceWorkerRegistration.prototype) {
      registration.sync.register('flight-data-sync');
    }
  } catch (error) {
    console.log('Service Worker registration failed:', error);
  }
}

// Handle messages from service worker
function handleServiceWorkerMessage(event) {
  const { type, message } = event.data;

  switch (type) {
    case 'CONNECTIVITY_RESTORED':
      showConnectivityMessage(message, 'success');
      fetchFlightData();
      break;
  }
}

// PWA Install prompt
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPromptEvent = event;
  showInstallButton();
});

// Handle when app gets installed
window.addEventListener('appinstalled', () => {
  console.log('PWA was installed');
  hideInstallButton();
  installPromptEvent = null;
});

// Show install button
function showInstallButton() {
  // Check if install button already exists or if app is already installed
  if (document.querySelector('.install-btn') || window.matchMedia('(display-mode: standalone)').matches) {
    return;
  }

  const installBtn = document.createElement('button');
  installBtn.className = 'button install-btn';
  installBtn.textContent = '📱 Install App';
  installBtn.onclick = promptInstall;

  const container = document.querySelector('.container');
  container.insertBefore(installBtn, document.querySelector('.last-update'));
}

// Prompt app installation
async function promptInstall() {
  if (!installPromptEvent) return;

  installPromptEvent.prompt();
  const result = await installPromptEvent.userChoice;

  if (result.outcome === 'accepted') {
    console.log('User accepted the install prompt');
    // Don't hide button here - let the 'appinstalled' event handle it
  } else {
    console.log('User dismissed the install prompt');
    // Keep the button visible for future attempts
  }

  // Clear the prompt event as it can only be used once
  installPromptEvent = null;
}

// Hide install button
function hideInstallButton() {
  const installBtn = document.querySelector('.install-btn');
  if (installBtn) {
    installBtn.remove();
  }
}

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
  console.log('Multi-Airline Flight Tracker PWA initialized');
  updateAirlineTheme();
  setupConnectivityMonitoring();
  fetchFlightData();
  // Auto-refresh every 30 seconds
  updateInterval = setInterval(fetchFlightData, 30000);
});

// Monitor connectivity changes
function setupConnectivityMonitoring() {
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  // Check initial connectivity
  updateConnectivityStatus();
}

// Handle coming back online
function handleOnline() {
  isOnline = true;
  updateConnectivityStatus();
  showConnectivityMessage('Connection restored! Refreshing flight data...', 'success');
  fetchFlightData();
}

// Handle going offline
function handleOffline() {
  isOnline = false;
  updateConnectivityStatus();
  showConnectivityMessage('You are offline. Showing cached data.', 'warning');
}

// Update UI based on connectivity status
function updateConnectivityStatus() {
  const statusEl = document.getElementById('status');
  const currentStatus = statusEl.textContent;

  if (!isOnline && !currentStatus.includes('Offline')) {
    statusEl.className = 'status error';
    statusEl.textContent = 'Offline Mode';
  }
}

// Show connectivity messages
function showConnectivityMessage(message, type) {
  const messageEl = document.createElement('div');
  messageEl.className = `connectivity-message ${type}`;
  messageEl.textContent = message;

  const container = document.querySelector('.container');
  container.insertBefore(messageEl, container.firstChild.nextSibling);

  // Remove after 5 seconds
  setTimeout(() => {
    messageEl.remove();
  }, 5000);
}

// Switch airline function
function switchAirline() {
  const select = document.getElementById('airline-select');
  currentAirline = select.value;
  console.log(`Switched to ${AIRLINE_CONFIGS[currentAirline].name}`);

  updateAirlineTheme();
  fetchFlightData();
}

// Update UI theme based on selected airline
function updateAirlineTheme() {
  const config = AIRLINE_CONFIGS[currentAirline];
  const logo = document.getElementById('airline-logo');

  logo.textContent = config.logo;

  // Update CSS custom properties for colors
  document.documentElement.style.setProperty('--primary-color', config.colors.primary);
  document.documentElement.style.setProperty('--secondary-color', config.colors.secondary);

  // Update gradient and button colors
  const body = document.body;
  const buttons = document.querySelectorAll('.button');
  const progressFill = document.getElementById('progress-fill');

  body.style.background = `linear-gradient(135deg, ${config.colors.primary} 0%, ${config.colors.secondary} 100%)`;

  buttons.forEach(button => {
    button.style.backgroundColor = config.colors.primary;
  });

  if (progressFill) {
    progressFill.style.background = `linear-gradient(90deg, ${config.colors.primary} 0%, ${config.colors.secondary} 100%)`;
  }
}

// Main function to fetch flight data
async function fetchFlightData() {
  const statusEl = document.getElementById('status');
  const refreshBtn = document.getElementById('refresh-btn');
  const errorContainer = document.getElementById('error-container');

  // Check if we're offline first
  if (!navigator.onLine) {
    statusEl.className = 'status error';
    statusEl.textContent = 'Offline Mode';
    refreshBtn.disabled = false;

    // Try to load cached data or show demo data
    const cachedData = await getCachedFlightData();
    if (cachedData) {
      updateUI(cachedData);
      showError('Showing cached flight data. You are currently offline.');
    } else {
      showDemoData();
      showError('You are offline. Showing demo data.');
    }
    return;
  }

  statusEl.className = 'status loading';
  statusEl.textContent = 'Updating...';
  refreshBtn.disabled = true;
  errorContainer.innerHTML = '';

  const config = AIRLINE_CONFIGS[currentAirline];

  // Build endpoint URLs for the current airline
  const endpoints = [
    `${config.baseUrl}${config.endpoints.flightInfo}`,
    `${config.baseUrl}${config.endpoints.flightStatus}`,
    `${config.baseUrl}${config.endpoints.flightData}`,
    `${config.baseUrl}${config.endpoints.altFlightInfo}`,
    `${config.baseUrl}${config.endpoints.altStatus}`,
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

        // Cache the successful data
        await cacheFlightData(data);

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
    if (isDevelopmentMode() || !navigator.onLine) {
      showDemoData();
      statusEl.className = 'status loading';
      statusEl.textContent = 'Demo Mode';
    } else {
      const airlineName = config.name;
      showError(
        `Unable to connect to ${airlineName} WiFi. Make sure you are connected to the ${airlineName} inflight WiFi network.`
      );
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
  const config = AIRLINE_CONFIGS[currentAirline];

  // Different demo data for each airline
  const demoFlights = {
    spirit: {
      flightNumber: 'NK 123',
      origin: 'Fort Lauderdale (FLL)',
      destination: 'Los Angeles (LAX)',
      altitude: 35000,
      speed: 520,
      timeRemaining: 145, // minutes
      progress: 62,
    },
    american: {
      flightNumber: 'AA 456',
      origin: 'Dallas (DFW)',
      destination: 'New York (JFK)',
      altitude: 38000,
      speed: 545,
      timeRemaining: 87, // minutes
      progress: 75,
    },
    delta: {
      flightNumber: 'DL 789',
      origin: 'Atlanta (ATL)',
      destination: 'Seattle (SEA)',
      altitude: 36000,
      speed: 532,
      timeRemaining: 203, // minutes
      progress: 45,
    },
  };

  const demoData = demoFlights[currentAirline];
  updateUI(demoData);
  console.log(`Demo data displayed for ${config.name}`);
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
  if (updateInterval) {
    clearInterval(updateInterval);
  }
});

// Cache flight data in localStorage
async function cacheFlightData(data) {
  try {
    const cacheData = {
      data: data,
      timestamp: Date.now(),
      airline: currentAirline,
    };
    localStorage.setItem('flightDataCache', JSON.stringify(cacheData));
  } catch (error) {
    console.log('Failed to cache flight data:', error);
  }
}

// Get cached flight data
async function getCachedFlightData() {
  try {
    const cached = localStorage.getItem('flightDataCache');
    if (!cached) return null;

    const cacheData = JSON.parse(cached);

    // Check if cache is for current airline and not too old (1 hour)
    const oneHour = 60 * 60 * 1000;
    if (cacheData.airline === currentAirline && Date.now() - cacheData.timestamp < oneHour) {
      return cacheData.data;
    }

    return null;
  } catch (error) {
    console.log('Failed to get cached flight data:', error);
    return null;
  }
}

// Request notification permission for PWA
async function requestNotificationPermission() {
  if ('Notification' in window && navigator.serviceWorker) {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }
  return false;
}

// Show notification (for flight updates)
function showNotification(title, options = {}) {
  if ('serviceWorker' in navigator && Notification.permission === 'granted') {
    navigator.serviceWorker.ready.then(registration => {
      registration.showNotification(title, {
        body: options.body || 'Flight status has been updated',
        icon: '/manifest.json',
        badge: '/manifest.json',
        vibrate: [200, 100, 200],
        ...options,
      });
    });
  }
}
