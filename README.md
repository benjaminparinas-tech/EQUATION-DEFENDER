# Equation Defender

Equation Defender represents an innovative fusion of educational mathematics and interactive gaming, implemented as a web-based three-dimensional space shooter. The project demonstrates the application of modern web technologies, specifically Three.js for 3D rendering, to create an engaging learning environment that combines entertainment with mathematical skill development.

## Getting Started

### Running the Game on Localhost

The game requires a local web server to run properly (for loading assets and CSV files). Here are several methods:

#### Method 1: Python HTTP Server (Recommended)

If you have Python installed:

```bash
# Navigate to the project directory
cd "C:\Users\Benjamin\Desktop\Equation Defender"

# Python 3.x
python -m http.server 8000

# Or Python 2.x (if needed)
python -m SimpleHTTPServer 8000
```

Then open your browser and go to: **http://localhost:8000**

#### Method 2: Node.js HTTP Server

If you have Node.js installed:

```bash
# Navigate to the project directory
cd "C:\Users\Benjamin\Desktop\Equation Defender"

# Install http-server globally (first time only)
npm install -g http-server

# Run the server
http-server -p 8000
```

Then open your browser and go to: **http://localhost:8000**

#### Method 3: PHP Built-in Server

If you have PHP installed:

```bash
# Navigate to the project directory
cd "C:\Users\Benjamin\Desktop\Equation Defender"

# Run PHP server
php -S localhost:8000
```

Then open your browser and go to: **http://localhost:8000**

#### Stopping the Server

Press `Ctrl + C` in the terminal to stop the server.

### Direct File Opening (Not Recommended)

⚠️ **Note**: Opening `index.html` directly in a browser may cause issues with loading assets and CSV files due to CORS restrictions. Using a local server is recommended.

## How to Play

1. Start the local server using one of the methods above
2. Open your browser and navigate to `http://localhost:8000`
3. Click "Play Game" to start
4. Type the answer to the falling equations and press Enter to shoot
5. Complete all 10 equations in each level to progress
6. You have 10 lives - if an equation reaches the bottom, you lose a life

## Game Levels

- **Level 1**: Basic arithmetic (MDAS) with 2-digit numbers
  - Points: 1 per correct answer
- **Level 2**: Algebra (solving for x)
  - Points: 2 per correct answer
- **Level 3**: Square roots, fractions, and 3+ digit arithmetic
  - Points: 3 per correct answer

## Controls

- Type the answer in the input field
- Press **Enter** to shoot the laser at the nearest matching enemy

## Features

- Always 3 equations on screen
- Auto-shoots nearest matching enemy
- Particle effects on enemy destruction
- Health bar system
- Level progression
- End game statistics dashboard

## Customizing Equations

Edit `equations.csv` to add or modify equations:
- Format: `level,equation,answer`
- Level must be 1, 2, or 3
- Answer should be a number (decimals supported)

## Requirements

- Modern web browser with JavaScript enabled (Chrome, Firefox, Edge, Safari)
- Internet connection (for loading Three.js, GLTFLoader, and PapaParse libraries from CDN)
- Local web server (Python, Node.js, or PHP) - see "Getting Started" section above

## Technical Architecture

- **Frontend Framework**: Vanilla JavaScript (ES6+)
- **3D Rendering Engine**: Three.js (r128)
- **Data Management**: CSV-based equation storage with PapaParse
- **3D Asset Loading**: GLTFLoader for binary model formats
- **Styling**: CSS3 with modern retro-futuristic visual effects
- **Audio System**: HTML5 Audio API for sound effects and background music
- **Typography**: Google Fonts (Orbitron) for retro-futuristic aesthetic

## Project Structure

```
Equation Defender/
├── index.html          # Main HTML file
├── game.js            # Game logic and Three.js implementation
├── style.css          # Styling and UI design
├── equations.csv      # Equation data (editable)
├── README.md          # This file
├── TheTeam.txt        # Member Roles
└── assets/
    ├── Logo.png       # Game logo
    ├── shooter.glb    # 3D spaceship model
    └── sounds/
        ├── laser.mp3      # Laser sound effect
        └── background.mp3  # Background music
```
