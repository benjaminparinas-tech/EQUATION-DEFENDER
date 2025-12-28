// Game State
let gameState = {
    currentLevel: 1,
    score: 0,
    health: 10,
    maxHealth: 10,
    equations: [],
    usedEquations: {
        1: new Set(),
        2: new Set(),
        3: new Set()
    },
    enemies: [],
    particles: [],
    levelStats: {
        1: { hit: 0, miss: 0, points: 0 },
        2: { hit: 0, miss: 0, points: 0 },
        3: { hit: 0, miss: 0, points: 0 }
    },
    currentInput: '',
    gameActive: false,
    equationsCompleted: 0,
    equationsPerLevel: 10
};

// Three.js Setup
let scene, camera, renderer;
let background;
let shooter;
let enemySpeed = 0.5; // Base speed
let spawnInterval;
let backgroundOffset = 0;

// Audio Setup
let laserSound;
let backgroundMusic;

// Initialize Three.js
function initThreeJS() {
    const canvas = document.getElementById('gameCanvas');
    const width = window.innerWidth;
    const height = window.innerHeight;

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    
    // Add stronger ambient light for better 3D appearance
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);
    
    // Add multiple directional lights for better visibility
    const directionalLight1 = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight1.position.set(0, 0, 5);
    scene.add(directionalLight1);
    
    const directionalLight2 = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight2.position.set(5, 5, 5);
    scene.add(directionalLight2);
    
    const directionalLight3 = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight3.position.set(-5, 5, 5);
    scene.add(directionalLight3);

    // Create scrolling background (stars)
    createBackground();

    // Create shooter sprite
    createShooter();

    // Handle window resize
    window.addEventListener('resize', () => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height);
    });
}

// Create infinite expanding starfield background with parallax
let stars = [];
function createBackground() {
    // Create more layers for infinite depth effect
    const starLayers = 6; // More layers for better infinite feel
    const starsPerLayer = 4000; // More stars for unending effect
    
    for (let layer = 0; layer < starLayers; layer++) {
        const starGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(starsPerLayer * 3);
        const colors = new Float32Array(starsPerLayer * 3);
        const sizes = new Float32Array(starsPerLayer);
        const twinkleSpeeds = new Float32Array(starsPerLayer);
        const velocities = new Float32Array(starsPerLayer * 3);
        
        // Deeper layers are further away and larger scale
        const depth = layer * 10;
        const layerScale = 1 + layer * 0.8;
        const maxDistance = 100 * layerScale; // Infinite expanding effect
        
        for (let i = 0; i < starsPerLayer; i++) {
            const i3 = i * 3;
            // Distribute stars in a larger area for infinite feel
            positions[i3] = (Math.random() - 0.5) * maxDistance;
            positions[i3 + 1] = (Math.random() - 0.5) * maxDistance;
            positions[i3 + 2] = (Math.random() - 0.5) * 50 - depth;
            
            // Bright visible star colors (cyan, magenta, white)
            const colorType = Math.random();
            let r, g, b;
            if (colorType < 0.33) {
                // Cyan stars - brighter
                r = 0.4 + Math.random() * 0.3;
                g = 0.9 + Math.random() * 0.1;
                b = 1.0;
            } else if (colorType < 0.66) {
                // Magenta stars - brighter
                r = 0.9 + Math.random() * 0.1;
                g = 0.4 + Math.random() * 0.3;
                b = 0.9 + Math.random() * 0.1;
            } else {
                // White stars - brighter
                const brightness = 0.85 + Math.random() * 0.15;
                r = brightness;
                g = brightness;
                b = 1.0;
            }
            colors[i3] = r;
            colors[i3 + 1] = g;
            colors[i3 + 2] = b;
            
            // Small but visible star sizes
            sizes[i] = 0.08 + Math.random() * 0.12; // Small but visible
            
            // Twinkle speed varies by layer
            twinkleSpeeds[i] = Math.random() * 0.02 + 0.01 + layer * 0.005;
            
            // Expansion velocity (stars move outward for infinite effect)
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.001 + layer * 0.0005;
            velocities[i3] = Math.cos(angle) * speed;
            velocities[i3 + 1] = Math.sin(angle) * speed;
            velocities[i3 + 2] = (Math.random() - 0.5) * speed * 0.5;
        }
        
        starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        starGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        starGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        starGeometry.setAttribute('twinkleSpeed', new THREE.BufferAttribute(twinkleSpeeds, 1));
        starGeometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
        
        const starMaterial = new THREE.PointsMaterial({
            size: 0.2, // Slightly larger for visibility
            sizeAttenuation: true,
            vertexColors: true,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending
        });
        
        const starField = new THREE.Points(starGeometry, starMaterial);
        starField.userData.twinkleOffset = Math.random() * Math.PI * 2;
        starField.userData.layer = layer;
        starField.userData.maxDistance = maxDistance;
        stars.push(starField);
        scene.add(starField);
    }
    
    background = stars;
}

// Load 3D spaceship model from GLB file
function createShooter() {
    // Wait a bit for GLTFLoader to load, then check
    setTimeout(() => {
        // Check if GLTFLoader is available
        if (typeof THREE === 'undefined' || !THREE.GLTFLoader) {
            console.warn('GLTFLoader not available, trying alternative loader...');
            // Try alternative approach
            if (window.GLTFLoader) {
                window.GLTFLoader = window.GLTFLoader;
            } else {
                console.warn('Using fallback geometry');
                createShooterFallback();
                return;
            }
        }
        
        try {
            const loader = new THREE.GLTFLoader();
            loadShooterModel(loader);
        } catch (e) {
            console.error('Error creating GLTFLoader:', e);
            createShooterFallback();
        }
    }, 100);
}

function loadShooterModel(loader) {
    
    console.log('Loading shooter model from: assets/shooter.glb');
    
    loader.load(
        'assets/shooter.glb',
        // onLoad callback
        function(gltf) {
            console.log('Shooter model loaded successfully!');
            shooter = gltf.scene;
            
            // Calculate bounding box to determine proper scale
            const box = new THREE.Box3().setFromObject(shooter);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            
            console.log('Model size:', size, 'Max dimension:', maxDim);
            
            // Scale to fit nicely (adjust multiplier as needed)
            const targetSize = 1.5; // Target size in world units
            const scale = maxDim > 0 ? targetSize / maxDim : 1;
            shooter.scale.set(scale, scale, scale);
            
            console.log('Model scaled to:', scale);
            
            // Position at bottom center (same as original)
            shooter.position.set(0, -3, 0);
            
            // Rotate to face forward (adjust based on model orientation)
            shooter.rotation.y = Math.PI; // Face forward (180 degrees)
            
            // Ensure model is visible and enhance materials
            shooter.traverse(function(child) {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                    
                    // Enhance materials to make them more visible
                    if (child.material) {
                        // Handle both single material and array of materials
                        const materials = Array.isArray(child.material) ? child.material : [child.material];
                        
                        materials.forEach(material => {
                            // Convert to MeshStandardMaterial if it's not already
                            if (material.type !== 'MeshStandardMaterial' && material.type !== 'MeshBasicMaterial') {
                                const newMaterial = new THREE.MeshStandardMaterial({
                                    color: material.color || 0xffffff,
                                    metalness: 0.3,
                                    roughness: 0.7,
                                    emissive: material.emissive || 0x000000,
                                    emissiveIntensity: 0.2
                                });
                                
                                // Copy texture if exists
                                if (material.map) newMaterial.map = material.map;
                                if (material.normalMap) newMaterial.normalMap = material.normalMap;
                                
                                child.material = Array.isArray(child.material) 
                                    ? child.material.map(() => newMaterial)
                                    : newMaterial;
                            } else {
                                // Enhance existing materials
                                if (material.emissive === undefined) {
                                    material.emissive = new THREE.Color(0x333333);
                                    material.emissiveIntensity = 0.3;
                                }
                                if (material.color) {
                                    // Brighten the color slightly
                                    material.color.multiplyScalar(1.5);
                                }
                            }
                            
                            material.needsUpdate = true;
                        });
                    }
                }
            });
            
            // Add multiple point lights near the shooter for better visibility
            const light1 = new THREE.PointLight(0x0096ff, 1.5, 10);
            light1.position.set(0, 0, 2);
            scene.add(light1);
            
            const light2 = new THREE.PointLight(0xffffff, 1.0, 10);
            light2.position.set(2, 2, 2);
            scene.add(light2);
            
            const light3 = new THREE.PointLight(0xffffff, 1.0, 10);
            light3.position.set(-2, 2, 2);
            scene.add(light3);
            
            scene.add(shooter);
            console.log('Shooter added to scene at position:', shooter.position);
            console.log('Shooter visible:', shooter.visible);
        },
        // onProgress callback
        function(xhr) {
            if (xhr.lengthComputable) {
                const percentComplete = (xhr.loaded / xhr.total) * 100;
                console.log('Model loading: ' + Math.round(percentComplete) + '%');
            }
        },
        // onError callback
        function(error) {
            console.error('Error loading shooter model:', error);
            console.error('Error details:', error.message || error);
            console.error('Full error:', error);
            // Fallback to simple geometry if model fails to load
            createShooterFallback();
        }
    );
}

// Fallback shooter if GLB fails to load
function createShooterFallback() {
    shooter = new THREE.Group();
    
    const bodyGeometry = new THREE.ConeGeometry(0.3, 0.6, 3);
    const bodyMaterial = new THREE.MeshPhongMaterial({ 
        color: 0x0096ff,
        emissive: 0x003366,
        shininess: 100
    });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.rotation.z = Math.PI;
    shooter.add(body);
    
    shooter.position.set(0, -3.5, 0);
    scene.add(shooter);
}

// Load equations from CSV
async function loadEquations() {
    try {
        const response = await fetch('equations.csv');
        const text = await response.text();
        const parsed = Papa.parse(text, { header: true });
        
        gameState.equations = parsed.data
            .filter(row => row.level && row.equation && row.answer)
            .map(row => ({
                level: parseInt(row.level),
                equation: row.equation.trim(),
                answer: parseFloat(row.answer.trim())
            }));
        
        console.log('Equations loaded:', gameState.equations.length);
    } catch (error) {
        console.error('Error loading equations:', error);
        // Fallback equations
        gameState.equations = getFallbackEquations();
    }
}

function getFallbackEquations() {
    return [
        { level: 1, equation: '2+3', answer: 5 },
        { level: 1, equation: '4*3', answer: 12 },
        { level: 1, equation: '10-5', answer: 5 },
        { level: 2, equation: '3x-4=2', answer: 2 },
        { level: 2, equation: '2x+5=11', answer: 3 },
        { level: 3, equation: 'sqrt(16)', answer: 4 },
        { level: 3, equation: '654/2', answer: 327 }
    ];
}

// Get random equation for current level (no duplicates)
function getRandomEquation() {
    const currentLevel = gameState.currentLevel;
    const usedSet = gameState.usedEquations[currentLevel];
    
    // Get all equations for this level that haven't been used
    const availableEquations = gameState.equations.filter(eq => 
        eq.level === currentLevel && !usedSet.has(eq.equation)
    );
    
    if (availableEquations.length === 0) {
        // All equations used, reset for this level
        gameState.usedEquations[currentLevel].clear();
        const allLevelEquations = gameState.equations.filter(eq => eq.level === currentLevel);
        if (allLevelEquations.length === 0) return null;
        const eq = allLevelEquations[Math.floor(Math.random() * allLevelEquations.length)];
        gameState.usedEquations[currentLevel].add(eq.equation);
        return eq;
    }
    
    const selected = availableEquations[Math.floor(Math.random() * availableEquations.length)];
    gameState.usedEquations[currentLevel].add(selected.equation);
    return selected;
}

// Create enemy from equation with modern design
function createEnemy(equationData) {
    const geometry = new THREE.PlaneGeometry(1.2, 0.7);
    const material = new THREE.MeshBasicMaterial({ 
        transparent: true,
        opacity: 1
    });
    
    const enemy = new THREE.Mesh(geometry, material);
    enemy.position.set(
        (Math.random() - 0.5) * 8,
        4,
        0
    );
    
    // Create retro-modern equation display with neon aesthetic
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Retro neon gradient background (cyan to magenta)
    const gradient = ctx.createLinearGradient(0, 0, 1024, 512);
    gradient.addColorStop(0, 'rgba(0, 255, 255, 0.9)');  // Cyan
    gradient.addColorStop(0.5, 'rgba(255, 0, 255, 0.9)');  // Magenta
    gradient.addColorStop(1, 'rgba(0, 255, 255, 0.9)');   // Cyan
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 1024, 512);
    
    // Retro scanline effect
    ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let y = 0; y < 512; y += 4) {
        ctx.fillRect(0, y, 1024, 2);
    }
    
    // Neon border with multiple glow layers (retro style)
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 30;
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 8;
    ctx.strokeRect(15, 15, 994, 482);
    
    // Inner neon border (magenta)
    ctx.shadowColor = '#ff00ff';
    ctx.shadowBlur = 20;
    ctx.strokeStyle = '#ff00ff';
    ctx.lineWidth = 4;
    ctx.strokeRect(25, 25, 974, 462);
    
    // Corner accents (retro style)
    const cornerSize = 30;
    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    // Top-left corner
    ctx.beginPath();
    ctx.moveTo(25, 25);
    ctx.lineTo(25 + cornerSize, 25);
    ctx.moveTo(25, 25);
    ctx.lineTo(25, 25 + cornerSize);
    ctx.stroke();
    // Top-right corner
    ctx.beginPath();
    ctx.moveTo(999, 25);
    ctx.lineTo(999 - cornerSize, 25);
    ctx.moveTo(999, 25);
    ctx.lineTo(999, 25 + cornerSize);
    ctx.stroke();
    // Bottom-left corner
    ctx.beginPath();
    ctx.moveTo(25, 487);
    ctx.lineTo(25 + cornerSize, 487);
    ctx.moveTo(25, 487);
    ctx.lineTo(25, 487 - cornerSize);
    ctx.stroke();
    // Bottom-right corner
    ctx.beginPath();
    ctx.moveTo(999, 487);
    ctx.lineTo(999 - cornerSize, 487);
    ctx.moveTo(999, 487);
    ctx.lineTo(999, 487 - cornerSize);
    ctx.stroke();
    
    // Retro equation text with neon glow
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 25;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 110px "Courier New", monospace'; // Retro monospace font
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(equationData.equation, 512, 256);
    
    // Additional glow layer for text
    ctx.shadowColor = '#00ffff';
    ctx.shadowBlur = 15;
    ctx.fillText(equationData.equation, 512, 256);
    
    // Remove shadow for next operations
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    const texture = new THREE.CanvasTexture(canvas);
    material.map = texture;
    material.needsUpdate = true;
    
    enemy.userData = {
        equation: equationData.equation,
        answer: equationData.answer,
        speed: enemySpeed
    };
    
    scene.add(enemy);
    gameState.enemies.push(enemy);
    
    return enemy;
}

// Spawn enemies (always keep 3 on screen)
function spawnEnemy() {
    if (!gameState.gameActive) return;
    if (gameState.equationsCompleted >= gameState.equationsPerLevel) return;
    
    // Keep 3 enemies on screen
    const activeEnemies = gameState.enemies.filter(e => e.visible);
    if (activeEnemies.length < 3) {
        const equationData = getRandomEquation();
        if (equationData) {
            createEnemy(equationData);
        }
    }
}

// Update enemies (move down)
function updateEnemies() {
    gameState.enemies.forEach((enemy, index) => {
        if (!enemy.visible) return;
        
        enemy.position.y -= enemy.userData.speed * 0.01;
        
        // Check if enemy reached bottom (missed)
        if (enemy.position.y < -3.8) {
            enemy.visible = false;
            gameState.health--;
            gameState.levelStats[gameState.currentLevel].miss++;
            updateHealthBar();
            gameState.equationsCompleted++;
            
            // Check game over
            if (gameState.health <= 0) {
                endGame();
                return;
            }
            
            // Spawn new enemy if level not complete
            if (gameState.equationsCompleted < gameState.equationsPerLevel) {
                setTimeout(spawnEnemy, 500);
            } else {
                // Level complete
                completeLevel();
            }
        }
    });
}

// Shoot laser at nearest matching enemy
function shootLaser(answer) {
    const numAnswer = parseFloat(answer);
    if (isNaN(numAnswer)) return;
    
    const activeEnemies = gameState.enemies.filter(e => e.visible);
    const matchingEnemies = activeEnemies.filter(e => 
        Math.abs(e.userData.answer - numAnswer) < 0.01
    );
    
    if (matchingEnemies.length === 0) {
        // No match found
        return;
    }
    
    // Find nearest matching enemy
    let nearestEnemy = null;
    let nearestDistance = Infinity;
    
    matchingEnemies.forEach(enemy => {
        const distance = Math.abs(enemy.position.x) + (4 - enemy.position.y);
        if (distance < nearestDistance) {
            nearestDistance = distance;
            nearestEnemy = enemy;
        }
    });
    
    if (nearestEnemy) {
        // Create laser
        createLaser(nearestEnemy);
        
        // Destroy enemy
        destroyEnemy(nearestEnemy);
        
        // Update stats
        const points = gameState.currentLevel;
        gameState.score += points;
        gameState.levelStats[gameState.currentLevel].hit++;
        gameState.levelStats[gameState.currentLevel].points += points;
        gameState.equationsCompleted++;
        
        updateScore();
        
        // Spawn new enemy if level not complete
        if (gameState.equationsCompleted < gameState.equationsPerLevel) {
            setTimeout(spawnEnemy, 500);
        } else {
            // Level complete
            completeLevel();
        }
    }
}

// Create laser beam
function createLaser(target) {
    // Play laser sound when laser is triggered
    if (laserSound) {
        laserSound.currentTime = 0; // Reset to beginning
        laserSound.play().catch(error => {
            console.log('Could not play laser sound:', error);
        });
    }
    
    // Get shooter position (handle both Group and GLTF scene)
    let shooterPos = new THREE.Vector3(0, -3.5, 0);
    if (shooter) {
        shooter.getWorldPosition(shooterPos);
    }
    
    const geometry = new THREE.BufferGeometry().setFromPoints([
        shooterPos,
        new THREE.Vector3(target.position.x, target.position.y, 0)
    ]);
    
    const material = new THREE.LineBasicMaterial({ 
        color: 0x00ffff,
        linewidth: 4
    });
    
    // Add glow effect to laser
    material.emissive = new THREE.Color(0x00ffff);
    material.emissiveIntensity = 1.5;
    
    const laser = new THREE.Line(geometry, material);
    scene.add(laser);
    
    // Remove laser after short time
    setTimeout(() => {
        scene.remove(laser);
        laser.geometry.dispose();
        laser.material.dispose();
    }, 100);
}

// Destroy enemy with particles
function destroyEnemy(enemy) {
    // Create particle explosion
    createParticles(enemy.position);
    
    // Remove enemy
    enemy.visible = false;
    scene.remove(enemy);
    enemy.geometry.dispose();
    enemy.material.dispose();
}

// Create particle explosion
function createParticles(position) {
    const particleCount = 20;
    
    for (let i = 0; i < particleCount; i++) {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array([position.x, position.y, position.z]);
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const material = new THREE.PointsMaterial({
            color: new THREE.Color().setHSL(Math.random(), 1, 0.5),
            size: 0.1,
            transparent: true,
            opacity: 1
        });
        
        const particle = new THREE.Points(geometry, material);
        particle.userData = {
            velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2,
                (Math.random() - 0.5) * 0.2
            ),
            life: 1.0
        };
        
        scene.add(particle);
        gameState.particles.push(particle);
    }
}

// Update particles
function updateParticles() {
    gameState.particles.forEach((particle, index) => {
        particle.position.add(particle.userData.velocity);
        particle.userData.life -= 0.02;
        particle.material.opacity = particle.userData.life;
        
        if (particle.userData.life <= 0) {
            scene.remove(particle);
            particle.geometry.dispose();
            particle.material.dispose();
            gameState.particles.splice(index, 1);
        }
    });
}

// Update background with infinite expanding parallax effect
let twinkleTime = 0;
function updateBackground() {
    if (!stars || stars.length === 0) return;
    
    twinkleTime += 0.015;
    backgroundOffset += 0.008;
    
    stars.forEach((starField, index) => {
        const positions = starField.geometry.attributes.position.array;
        const colors = starField.geometry.attributes.color.array;
        const twinkleSpeeds = starField.geometry.attributes.twinkleSpeed.array;
        const velocities = starField.geometry.attributes.velocity.array;
        const maxDistance = starField.userData.maxDistance;
        
        // Parallax scrolling - deeper layers move slower
        const parallaxSpeed = 0.002 / (index + 1);
        starField.rotation.z += parallaxSpeed * 0.1;
        
        // Infinite expanding effect - stars move outward
        for (let i = 0; i < positions.length / 3; i++) {
            const i3 = i * 3;
            
            // Move stars outward (expansion effect)
            positions[i3] += velocities[i3] * (index + 1);
            positions[i3 + 1] += velocities[i3 + 1] * (index + 1);
            positions[i3 + 2] += velocities[i3 + 2] * (index + 1);
            
            // Wrap stars that go too far (infinite loop)
            const distance = Math.sqrt(positions[i3] ** 2 + positions[i3 + 1] ** 2);
            if (distance > maxDistance) {
                // Reset to center with new random direction
                const angle = Math.random() * Math.PI * 2;
                positions[i3] = Math.cos(angle) * 5;
                positions[i3 + 1] = Math.sin(angle) * 5;
            }
            
            // Subtle twinkling effect - keep stars bright and visible
            const twinkle = Math.sin(twinkleTime * twinkleSpeeds[i] + starField.userData.twinkleOffset + i * 0.1) * 0.2 + 0.8;
            
            // Preserve color hue but keep brightness high
            const baseR = colors[i3];
            const baseG = colors[i3 + 1];
            const baseB = colors[i3 + 2];
            
            // Ensure minimum brightness for visibility
            colors[i3] = Math.max(baseR * twinkle, 0.6);
            colors[i3 + 1] = Math.max(baseG * twinkle, 0.6);
            colors[i3 + 2] = Math.max(baseB * twinkle, 0.7);
        }
        
        starField.geometry.attributes.position.needsUpdate = true;
        starField.geometry.attributes.color.needsUpdate = true;
    });
}

// Complete current level
function completeLevel() {
    if (gameState.currentLevel < 3) {
        gameState.currentLevel++;
        gameState.equationsCompleted = 0;
        // Reset used equations for new level
        gameState.usedEquations[gameState.currentLevel].clear();
        // Make speed slower as level increases (more time to solve harder equations)
        enemySpeed = 0.5 - (gameState.currentLevel - 1) * 0.1; // Level 1: 0.5, Level 2: 0.4, Level 3: 0.3
        if (enemySpeed < 0.2) enemySpeed = 0.2; // Minimum speed
        updateLevelDisplay();
        
        // Clear remaining enemies
        gameState.enemies.forEach(enemy => {
            scene.remove(enemy);
            enemy.geometry.dispose();
            enemy.material.dispose();
        });
        gameState.enemies = [];
        
        // Start next level
        setTimeout(() => {
            startLevel();
        }, 1000);
    } else {
        // All levels complete
        endGame();
    }
}

// Start level
function startLevel() {
    // Clear any existing spawn interval
    if (spawnInterval) {
        clearInterval(spawnInterval);
    }
    
    // Spawn initial 3 enemies
    for (let i = 0; i < 3; i++) {
        setTimeout(() => spawnEnemy(), i * 500);
    }
    
    // Continue spawning to maintain 3 enemies
    spawnInterval = setInterval(spawnEnemy, 2000);
}

// End game
function endGame() {
    gameState.gameActive = false;
    clearInterval(spawnInterval);
    
    // Keep background music playing (don't stop it)
    // Music will continue looping in the background
    
    // Show end screen
    showEndScreen();
}

// UI Updates
function updateHealthBar() {
    const healthPercent = (gameState.health / gameState.maxHealth) * 100;
    const healthBar = document.getElementById('healthBar');
    healthBar.style.setProperty('--health-width', healthPercent + '%');
    
    const healthText = document.getElementById('healthText');
    healthText.textContent = `Health: ${gameState.health}/${gameState.maxHealth}`;
}

function updateScore() {
    document.getElementById('scoreDisplay').textContent = `Score: ${gameState.score}`;
}

function updateLevelDisplay() {
    document.getElementById('levelDisplay').textContent = `Level: ${gameState.currentLevel}`;
}

// Show end screen with stats
function showEndScreen() {
    document.getElementById('gameScreen').classList.add('hidden');
    document.getElementById('endScreen').classList.remove('hidden');
    
    const statsContainer = document.getElementById('statsContainer');
    statsContainer.innerHTML = '';
    
    let totalPoints = 0;
    
    for (let level = 1; level <= 3; level++) {
        const stats = gameState.levelStats[level];
        totalPoints += stats.points;
        
        const levelDiv = document.createElement('div');
        levelDiv.className = 'level-stats';
        levelDiv.innerHTML = `
            <h2>Level ${level}</h2>
            <p>Hit: ${stats.hit}</p>
            <p>Miss: ${stats.miss}</p>
            <p>Points earned: ${stats.points}</p>
        `;
        statsContainer.appendChild(levelDiv);
    }
    
    const totalDiv = document.createElement('div');
    totalDiv.className = 'total-stats';
    totalDiv.innerHTML = `<h2>Total Points: ${totalPoints}</h2>`;
    statsContainer.appendChild(totalDiv);
}

// Reset game
function resetGame() {
    // Clear intervals
    if (spawnInterval) {
        clearInterval(spawnInterval);
        spawnInterval = null;
    }
    
    gameState = {
        currentLevel: 1,
        score: 0,
        health: 10,
        maxHealth: 10,
        equations: [],
        usedEquations: {
            1: new Set(),
            2: new Set(),
            3: new Set()
        },
        enemies: [],
        particles: [],
        levelStats: {
            1: { hit: 0, miss: 0, points: 0 },
            2: { hit: 0, miss: 0, points: 0 },
            3: { hit: 0, miss: 0, points: 0 }
        },
        currentInput: '',
        gameActive: false,
        equationsCompleted: 0,
        equationsPerLevel: 10
    };
    
    enemySpeed = 0.5; // Reset to base speed for level 1
    
    // Clear stars array
    stars = [];
    
    // Clear scene
    while (scene.children.length > 0) {
        scene.remove(scene.children[0]);
    }
    
    createBackground();
    createShooter();
    
    updateHealthBar();
    updateScore();
    updateLevelDisplay();
}

// Start game
function startGame() {
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameScreen').classList.remove('hidden');
    document.getElementById('endScreen').classList.add('hidden');
    
    resetGame();
    gameState.gameActive = true;
    
    // Start background music (loop continuously)
    if (backgroundMusic) {
        backgroundMusic.loop = true;
        backgroundMusic.volume = 0.5; // Set volume (0.0 to 1.0)
        
        // Only play if not already playing
        if (backgroundMusic.paused) {
            backgroundMusic.play().catch(error => {
                console.log('Could not play background music:', error);
                // Some browsers require user interaction before playing audio
                // Try again after user interaction
                document.addEventListener('click', function startMusicOnce() {
                    if (backgroundMusic && backgroundMusic.paused) {
                        backgroundMusic.play().catch(e => console.log('Music play failed:', e));
                    }
                    document.removeEventListener('click', startMusicOnce);
                }, { once: true });
            });
        }
    }
    
    loadEquations().then(() => {
        startLevel();
    });
    
    // Focus input
    document.getElementById('answerInput').focus();
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    if (gameState.gameActive) {
        updateBackground();
        updateEnemies();
        updateParticles();
    }
    
    renderer.render(scene, camera);
}

// Event Listeners
document.getElementById('playButton').addEventListener('click', startGame);
document.getElementById('playAgainButton').addEventListener('click', startGame);
document.getElementById('quitButton').addEventListener('click', () => {
    // Stop background music when quitting to start screen
    if (backgroundMusic && !backgroundMusic.paused) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0; // Reset to beginning
    }
    
    document.getElementById('endScreen').classList.add('hidden');
    document.getElementById('startScreen').classList.remove('hidden');
});

document.getElementById('answerInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && gameState.gameActive) {
        const answer = document.getElementById('answerInput').value;
        if (answer.trim()) {
            shootLaser(answer);
            document.getElementById('answerInput').value = '';
        }
    }
});

// Load audio files
function loadAudio() {
    // Load laser sound
    laserSound = new Audio('assets/sounds/laser.mp3');
    laserSound.preload = 'auto';
    laserSound.volume = 0.7; // Set volume (0.0 to 1.0)
    
    // Load background music
    backgroundMusic = new Audio('assets/sounds/background.mp3');
    backgroundMusic.preload = 'auto';
    backgroundMusic.loop = true; // Enable looping
    backgroundMusic.volume = 0.5; // Set volume (0.0 to 1.0)
    
    // Handle audio loading errors
    laserSound.addEventListener('error', (e) => {
        console.error('Error loading laser sound:', e);
    });
    
    backgroundMusic.addEventListener('error', (e) => {
        console.error('Error loading background music:', e);
    });
}

// Initialize
window.addEventListener('load', () => {
    initThreeJS();
    animate();
    loadEquations();
    loadAudio(); // Load audio files
});

