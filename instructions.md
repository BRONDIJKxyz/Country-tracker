# 🌍 World Travel Tracker — Instructions

## 🎯 Project Goal
Create a minimalist web app that lets users **visually mark the countries they've visited** on a greyscale world map. When clicked, a **red flag appears on the country** (like it’s conquered). After finishing, users can click "Done" and generate a **sharable results screen** that includes:

- % of countries visited globally
- % of countries visited per continent
- a final colored map view showing their travel footprint

This app should feel fun, gamified, lightweight, and social-media friendly.

---

## ✨ Key Features

### World Map Interaction
- Display a **greyscale interactive world map**
- Allow **easy clicking on countries** (mobile + desktop)
- When a country is clicked:
  - Show a **small red flag icon** on that country
  - Mark it as visited (highlight or un-grey it subtly)

### Tracking
- Keep track of:
  - Total countries visited
  - Countries per continent visited
- Auto-calculate:
  - % visited globally
  - % visited per continent

### Summary Page (after clicking “Done”)
- Show the final world map with the clicked countries
- Display:
  - Total countries visited (e.g., “43 of 195”)
  - % of the world visited
  - % per continent
- Provide a **“Share This” button**
  - Shareable image or link with the map and stats
  - Ideal aspect ratio for social sharing (e.g., square or story format)

---

## 🎨 Style & UX

- World map: **neutral grey**, visited countries become **slightly colored with a red flag**
- Flags: clean icon, keep it **small & subtle**, like a "conquer" marker
- Mobile-first layout with smooth tapping
- Use modern fonts, bold numbers for %s, and a fun “gamified” feel
- Final summary page: clean and designed for sharing
  - Add optional title: “My Travel Footprint” or similar

---

## 🧠 Tech Stack Hints

- Use **SVG or GeoJSON** world map (e.g., D3.js, or a lightweight map lib like [TopoJSON + Canvas/SVG])
- JavaScript or React frontend (whichever is faster in Windsurf)
- Store visited countries in local state (no need for user accounts)
- Bonus: generate a **PNG export** of the final summary screen for easy sharing

---

## ✅ Success Criteria

- User can easily click/tap countries and visually see red flags placed
- App tracks visited % globally and per continent
- After clicking “Done”, user gets a clean shareable screen with the map and stats
- The site is fast, minimal, modern, and mobile-friendly

---

## 📁 Files to Expect

- `index.html` – landing map view
- `style.css` – minimal, clean UI
- `script.js` or `main.jsx` – interactive logic
- `world-data.js` or `map.json` – country shapes and metadata
- `README.md` – setup and usage instructions

---

## 🗺 Bonus Ideas (Optional if time allows)

- Add continent filters (to view stats per continent)
- Add “Reset Map” button
- Include an emoji-based travel badge (🏴‍☠️ style)