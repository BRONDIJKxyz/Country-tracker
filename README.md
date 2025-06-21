# 🌍 World Travel Tracker

A minimalist web application that lets users visually mark and track countries they've visited on an interactive world map.

## 📋 Features

- **Interactive World Map**: Click/tap on countries to mark them as visited
- **Visual Indicators**: Red flags appear on visited countries
- **Real-time Statistics**: 
  - Total countries visited
  - Global completion percentage
  - Continent-specific completion rates
- **Shareable Results**: Generate a visual summary of your travels
- **Mobile-friendly**: Works on both desktop and mobile devices

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No server-side requirements (fully client-side)

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/yourusername/world-travel-tracker.git
   ```

2. Navigate to the project directory:
   ```bash
   cd world-travel-tracker
   ```

3. Open `index.html` in your browser or use a local server:
   ```bash
   # Using Python's built-in server
   python3 -m http.server 8000
   ```

4. Access the application at `http://localhost:8000`

## 🧩 How to Use

1. **Mark Countries**: Click or tap on any country to mark it as visited (a red flag will appear)
2. **View Statistics**: Check your progress in real-time with the stats at the top and bottom of the screen
3. **Navigate the Map**: Use the zoom controls to explore regions in detail
4. **Generate Summary**: Click "Done" to view and share your travel statistics
5. **Share Your Results**: Download an image or copy a shareable link from the summary screen

## 💻 Technical Details

- Built with vanilla JavaScript, HTML, and CSS
- Uses D3.js for map rendering and interaction
- Map data from TopoJSON
- Responsive design that works across devices

## 📁 Project Structure

- `index.html` - Main HTML document
- `styles.css` - CSS styling
- `script.js` - Main JavaScript logic
- `world-data.js` - Country and continent data

## 📝 License

This project is provided as is, for personal use.

## 🙏 Acknowledgements

- Map data provided by [World Atlas TopoJSON](https://github.com/topojson/world-atlas)
- Powered by D3.js visualization library
