# NOTICE

This is a work in progress. This will never work if you are not connected to Spirit wifi. Trying to find a workaround so this works without requiring a paid plan.

# Spirit Airlines Flight Tracker

A basic HTML + JavaScript application that connects to Spirit Airlines' inflight WiFi portal API to display real-time flight information.

## Features

- Real-time flight tracking
- Flight progress indicator
- Displays altitude, speed, and time remaining
- Auto-refresh every 30 seconds
- Demo mode for testing outside the aircraft

## How to Use

### On Spirit Airlines Flight

1. Connect to the `SpiritWiFi` network on your device
2. Open this HTML file in your web browser
3. The page will automatically fetch and display your current flight information

### For Development/Testing

1. Open `index.html` in your web browser
2. The app will run in demo mode showing sample flight data
3. You can test the UI and functionality

## API Endpoints

The application attempts to connect to several common inflight WiFi API endpoints:

- `/api/flight/info`
- `/api/flight/status`
- `/api/v1/flight`
- `/flight-info`
- `/status.json`

## Files

- `index.html` - Main HTML page with styling
- `app.js` - JavaScript application logic
- `README.md` - This file

## Technical Details

The application is built with vanilla JavaScript and requires no external dependencies. It uses the Fetch API to retrieve flight data and updates the UI dynamically.

### Expected API Response Format

The app can handle various response formats, but expects data like:

```json
{
  "flightNumber": "NK 123",
  "origin": "FLL",
  "destination": "LAX",
  "altitude": 35000,
  "speed": 520,
  "timeRemaining": 145,
  "progress": 62
}
```

## Notes

- This application only works when connected to Spirit Airlines inflight WiFi
- API endpoints are estimated based on common inflight portal patterns
- The actual Spirit Airlines API structure may differ and require adjustments
- CORS restrictions may apply when testing locally

## Deployment

### GitHub Pages (Automatic)

This project is configured with GitHub Actions to automatically deploy to GitHub Pages.

**Setup Instructions:**

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/SpiritFlightTracker.git
   git push -u origin main
   ```

2. **Enable GitHub Pages:**
   - Go to your repository settings
   - Navigate to "Pages" in the left sidebar
   - Under "Source", select "GitHub Actions"
   - The site will be available at: `https://YOUR_USERNAME.github.io/SpiritFlightTracker/`

3. **Automatic Deployment:**
   - Every push to `main` branch triggers automatic deployment
   - GitHub Actions workflows handle building and deploying
   - Check the "Actions" tab to monitor deployment status

### Git Hooks

This project includes pre-commit and pre-push hooks for code quality:

**Install hooks:**
```bash
./setup-hooks.sh
```

**What the hooks do:**
- **pre-commit**: Validates JavaScript syntax, checks for debugging statements, validates HTML structure
- **pre-push**: Runs comprehensive checks before pushing to remote

**Bypass hooks (not recommended):**
```bash
git commit --no-verify
git push --no-verify
```

### GitHub Actions Workflows

- **deploy.yml**: Automatically deploys to GitHub Pages on push to main
- **test.yml**: Validates HTML/JS files on push and PR
- **pr-check.yml**: Runs checks on pull requests with automated comments

## Development

### Local Development
1. Clone the repository
2. Run the setup script: `./setup-hooks.sh`
3. Open `index.html` in your browser for testing

### Contributing
1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Commit with descriptive messages
5. Push to your fork
6. Open a Pull Request

## Disclaimer

This is an unofficial tool and is not affiliated with Spirit Airlines. Use at your own risk.
