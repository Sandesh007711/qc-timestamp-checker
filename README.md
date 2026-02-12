# QC Name Timestamp Checker

A pure client-side web app to speed up QC of YouTube name timestamps. Upload an Excel file with names and YouTube links, watch videos inline with an embedded player, and mark pass/fail with notes. No backend required - runs entirely in the browser.

## Features

- **Pure Frontend**: No server needed, runs entirely in the browser
- **Excel Upload**: Upload `.xlsx` or `.xls` files directly
- **Embedded Player**: Watch YouTube videos inline
- **Auto-play**: Cycle through videos with configurable duration (3-20 seconds)
- **QC Tracking**: Radio buttons for Pass/Fail/Pending status
- **CSV Export**: Download QC results
- **GitHub Pages Ready**: Deploy to GitHub Pages instantly

## Usage

1. Open `index.html` in your browser (or visit the deployed GitHub Pages URL)
2. Prepare an Excel file with:
   - Column A: Names
   - Column B: YouTube links with timestamps (e.g., `https://youtu.be/jV4fUvYeslQ?t=589`)
3. Upload the Excel file
4. Videos will load in the embedded player
5. Use **Prev/Next** to navigate or **Auto-play** to cycle through
6. Mark each entry as Pass/Fail and add notes
7. Export results as CSV

## Deploy to GitHub Pages

1. Create a new repository on GitHub
2. Push these files to the repository:
   - `index.html`
   - `styles.css`
   - `app.js`
   - `README.md`
3. Go to repository Settings → Pages
4. Select branch (usually `main`) and root folder
5. Save and wait for deployment
6. Access your site at `https://[username].github.io/[repo-name]/`

## Local Development

Simply open `index.html` in any modern browser. No build process or server required.

## Technical Details

- Uses [SheetJS](https://sheetjs.com/) for Excel parsing (loaded via CDN)
- Uses YouTube IFrame API for embedded video player
- Pure HTML/CSS/JavaScript - no frameworks
- All processing happens client-side
- Works offline after initial page load (except YouTube API)

## Browser Compatibility

Requires a modern browser with:
- ES6 JavaScript support
- FileReader API
- Fetch API (for CDN resources)
