class Game {
    constructor(canvas, context) {
        this.canvas = canvas;
        this.ctx = context;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.baseHeight = 720;
        this.ratio = this.height / this.baseHeight;
        this.background = new Background(this);
        this.player = new Player(this);
        this.sound = new AudioControl(this); // Sound
        this.enemys = [];
        this.numberOfEnemys = 15;
        this.gravity;
        this.speed;
        this.score;
        this.highScore = parseInt(localStorage.getItem('highScore')) || 0; // Initialize high score
        this.gameOver = false; // Inicializando o estado de game over
        this.gameStarted = false;  // New state for menu
        this.showingControls = false;  // New state for controls screen
        this.timer;
        this.message1;
        this.message2;
        this.minSpeed;
        this.maxSpeed;
        this.eventTimer = 0;
        this.eventInterval = 0.5;
        this.eventUpdate = false;
        this.touchStarX;
        this.swipeDistance = 50;
        this.debug = false;
        this.enemyCount = 0; // Contador de inimigos criados
        this.selectedMenuItem = 0;  // For menu navigation
        this.menuItems = ['Start Game', 'Difficulty', 'Controls', 'Exit'];
        this.menuHoverIndex = -1;  // Track which menu item is being hovered
        this.showingDifficulty = false;  // New state for difficulty screen
        this.difficulties = ['Easy', 'Normal', 'Hard'];
        this.selectedDifficulty = 1;  // Default to Normal
        this.difficultyHoverIndex = -1;
        this.difficultySettings = {
            'Easy': {
                enemySpeed: 0.5,    // Much slower enemies
                spawnInterval: 0.5,  // Faster spawns (was 1.0)
                scoreToWin: 5,      // Need fewer kills to win
                enemyCount: 10      // Fixed at 10 enemies
            },
            'Normal': {
                enemySpeed: 1.0,    // Base speed
                spawnInterval: 0.25, // Faster spawns (was 0.5)
                scoreToWin: 7,      // Need 7 kills to win
                enemyCount: 10      // Fixed at 10 enemies
            },
            'Hard': {
                enemySpeed: 1.8,    // Much faster enemies
                spawnInterval: 0.1,  // Much faster spawns (was 0.2)
                scoreToWin: 10,     // Need all kills to win
                enemyCount: 10      // Fixed at 10 enemies
            }
        };
        this.menuAnimations = this.menuItems.map(() => ({
            scale: 1,
            alpha: 0,
            targetScale: 1,
            targetAlpha: 0
        }));
        this.lastTime = 0;
        this.menuMusic = document.getElementById('menu-audio');
        this.gameMusic = document.getElementById('game-audio');
        this.isMuted = false;
        this.gameOverSoundPlayed = false;  // Reset the game over sound flag
        this.isWinner = false;  // New state for victory condition

        // Set initial volumes and fade settings
        this.menuMusic.volume = 0;
        this.gameMusic.volume = 0;
        this.targetMenuVolume = 0.15;  // Reduced from 0.3 to 0.15
        this.targetGameVolume = 0.15;  // Reduced from 0.3 to 0.15
        this.musicFadeSpeed = 0.02;

        // Start menu music
        this.menuMusic.play().catch(error => console.log("Menu audio play failed:", error));
        this.fadeInMusic(this.menuMusic);

        this.resize(window.innerWidth, window.innerHeight);

        window.addEventListener('resize', e => {
            this.resize(e.currentTarget.innerWidth, e.currentTarget.innerHeight);
        });

        // Mouse controls
        this.canvas.addEventListener('mousedown', e => {
            this.player.flap();
        });

        this.canvas.addEventListener('mouseup', e => {
            this.player.wingsUp();
        });

        // Keyboard controls
        window.addEventListener('keydown', e => {
            if (!this.gameStarted) {
                if (this.showingControls || this.showingDifficulty) {
                    if (e.key === 'Escape') {
                        this.showingControls = false;
                        this.showingDifficulty = false;
                    }
                    if (this.showingDifficulty) {
                        if (e.key === 'ArrowUp') {
                            this.selectedDifficulty = (this.selectedDifficulty - 1 + this.difficulties.length) % this.difficulties.length;
                            this.playSound('menuHover');
                        } else if (e.key === 'ArrowDown') {
                            this.selectedDifficulty = (this.selectedDifficulty + 1) % this.difficulties.length;
                            this.playSound('menuHover');
                        } else if (e.key === 'Enter') {
                            this.showingDifficulty = false;
                            this.playSound('menuSelect');
                        }
                    }
                    return;
                }
                
                if (e.key === 'ArrowUp') {
                    this.selectedMenuItem = (this.selectedMenuItem - 1 + this.menuItems.length) % this.menuItems.length;
                } else if (e.key === 'ArrowDown') {
                    this.selectedMenuItem = (this.selectedMenuItem + 1) % this.menuItems.length;
                } else if (e.key === 'Enter') {
                    this.handleMenuSelection();
                }
                return;
            }

            // Existing controls
            if ((e.key === ' ') || (e.key === 'Enter')) {
                this.player.flap();
            }

            if ((e.key === 'Shift') || (e.key.toLowerCase() === 'c')) {
                this.player.startCharge();
            }

            if (e.key.toLowerCase() === 'r') {
                if (this.gameOver) {
                    // Return to menu if game is over
                    this.gameStarted = false;
                    this.showingControls = false;
                    this.gameOver = false;
                    this.selectedMenuItem = 0;  // Reset menu selection
                    this.menuAnimations = this.menuItems.map(() => ({
                        scale: 0.5,  // Start small for entrance animation
                        alpha: 0,
                        targetScale: 1,
                        targetAlpha: 0
                    }));
                    this.resize(window.innerWidth, window.innerHeight);
                } else {
                    // Just resize if in active game
                    this.resize(window.innerWidth, window.innerHeight);
                }
            }

            if (e.key.toLowerCase() === 'd') {
                this.debug = !this.debug;
            }

            if (e.key.toLowerCase() === 'e') {
                this.player.shoot();
            }

            // Controle do movimento vertical
            if (e.key === 'ArrowUp') {
                this.player.speedY = -this.player.maxSpeedY;
            } else if (e.key === 'ArrowDown') {
                this.player.speedY = this.player.maxSpeedY;
            }

            if (e.key === 'Escape' && this.gameStarted) {
                this.gameStarted = false;
                this.showingControls = false;
                this.gameOver = false;
                this.resize(window.innerWidth, window.innerHeight);
            }

            if (e.key.toLowerCase() === 'm') {
                this.toggleMute();
            }
        });

        window.addEventListener('keyup', e => {
            this.player.wingsUp();

            // Parar o movimento vertical ao soltar as teclas
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                this.player.speedY = 0;
            }
        });

        // Touch controls
        this.canvas.addEventListener('touchstart', e => {
            this.player.flap();
            this.touchStartX = e.changedTouches[0].pageX;
        });

        this.canvas.addEventListener('touchmove', e => {
            if (e.changedTouches[0].pageX - this.touchStartX > this.swipeDistance) {
                this.player.startCharge();
            }
        });

        // Add mouse move handler for menu hover
        this.canvas.addEventListener('mousemove', e => {
            if (!this.gameStarted && !this.showingControls && !this.showingDifficulty) {
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                this.handleMenuHover(mouseX, mouseY);
            }
        });

        // Add click handler for menu selection
        this.canvas.addEventListener('click', e => {
            if (!this.gameStarted && !this.showingControls && !this.showingDifficulty) {
                const rect = this.canvas.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const mouseY = e.clientY - rect.top;
                this.handleMenuClick(mouseX, mouseY);
            }
        });

        // Add mouseleave event handler in constructor after other mouse event handlers
        this.canvas.addEventListener('mouseleave', () => {
            if (!this.gameStarted && !this.showingControls && !this.showingDifficulty) {
                this.menuHoverIndex = -1;  // Reset hover state when mouse leaves canvas
            }
        });

        this.createEnemys();

        // Initialize sound effects
        this.sounds = {
            laser: document.getElementById('laser-sound'),
            explosion: document.getElementById('explosion-sound'),
            boost: document.getElementById('boost-sound'),
            hit: document.getElementById('hit-sound'),
            menuSelect: document.getElementById('menu-select'),
            menuHover: document.getElementById('menu-hover'),
            gameOver: document.getElementById('game-over'),
            victory: document.getElementById('victory-sound')  // Add victory sound
        };

        // Set sound volumes
        Object.values(this.sounds).forEach(sound => {
            if (sound.id === 'game-over' || sound.id === 'victory') {
                sound.volume = 0.4;  // Slightly louder for impact
            } else {
                sound.volume = 0.3;  // Default volume for other sounds
            }
        });
    }

    resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = this.canvas.width;
        this.height = this.canvas.height;
        this.ctx.font = '15px Bungee';
        this.ctx.textAlign = 'right';
        this.ctx.lineWidth = 3;
        this.ctx.strokeStyle = 'white';
        this.ratio = this.height / this.baseHeight;

        this.gravity = 0.15 * this.ratio;
        this.speed = 3 * this.ratio;
        this.minSpeed = this.speed;
        this.maxSpeed = this.speed * 5;

        this.background.resize();
        this.player.resize();
        this.enemys.forEach(enemy => {
            enemy.resize();
        });

        this.score = 0;
        this.gameOver = false;
        this.isWinner = false;  // Reset winner state
        this.gameOverSoundPlayed = false;
        this.timer = 0;
    }

    render(deltaTime) {
        this.background.update();
        this.background.draw();

        if (!this.gameStarted) {
            // Ensure menu music is playing
            if (this.menuMusic.paused && !this.isMuted) {
                this.menuMusic.play().catch(error => console.log("Menu audio play failed:", error));
                this.fadeInMusic(this.menuMusic);
            }
            
            if (this.showingControls) {
                this.drawControlsScreen();
            } else if (this.showingDifficulty) {
                this.drawDifficultyScreen();
            } else {
                this.updateMenuAnimations(deltaTime);
                this.drawMenu();
            }
            return;
        }

        if (!this.gameOver) this.timer += deltaTime;
        this.handlePeriodicEvents(deltaTime);
        this.drawStatusText();
        this.player.update();
        this.player.draw();
        this.enemys = this.enemys.filter(enemy => !enemy.markedForDeletion);
        this.enemys.forEach(enemy => {
            enemy.update(deltaTime);
            enemy.draw();
        });

        if (this.gameOver) {
            this.drawGameOver();
        }
    }

    createEnemys() {
        const firstX = this.width;
        const enemySpacing = 600 * this.ratio;

        if (this.enemyCount < this.numberOfEnemys) {
            this.enemys.push(new Enemy(this, firstX + this.enemyCount * enemySpacing));
            this.enemyCount++;
        }
    }

    formatTimer() {
        return (this.timer * 0.001).toFixed(1);
    }

    handlePeriodicEvents(deltaTime) {
        if (this.eventTimer < this.eventInterval) {
            this.eventTimer += deltaTime;
            this.eventUpdate = false;
        } else {
            this.eventTimer = this.eventTimer % this.eventInterval;
            this.eventUpdate = true;
            // Criar novos inimigos a cada 1 segundo
            this.createEnemys();
        }
    }

    drawStatusText() {
        this.ctx.save();
        
        // Draw Score and Timer background
        const statsPanelWidth = 180;
        const statsPanelHeight = 80;
        const statsX = 10;
        const statsY = 10;
        
        // Draw semi-transparent background for stats
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(statsX, statsY, statsPanelWidth, statsPanelHeight);
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(statsX, statsY, statsPanelWidth, statsPanelHeight);

        // Draw Stats Title
        this.ctx.font = '16px Bungee';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('STATS', statsX + statsPanelWidth/2, statsY + 25);

        // Draw Score and Timer with icons
        this.ctx.font = '14px Bungee';
        this.ctx.textAlign = 'left';
        
        // Draw Score
        this.ctx.fillStyle = '#89F336';  // Green color for score
        this.ctx.fillText('⭐ Score: ' + this.score, statsX + 15, statsY + 50);
        
        // Draw Timer
        this.ctx.fillStyle = '#00B4D8';  // Blue color for timer
        this.ctx.fillText('⏱ Time: ' + this.formatTimer(), statsX + 15, statsY + 70);

        if (this.gameOver) {
            this.drawGameOver();
        }

        // Draw Boost Gauge
        const gaugeWidth = 200 * this.ratio;
        const gaugeHeight = 20 * this.ratio;
        const gaugeX = 10;
        const gaugeY = this.height - gaugeHeight - 10;
        
        // Draw gauge background
        this.ctx.fillStyle = '#333333';
        this.ctx.fillRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight);
        
        // Draw gauge border
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(gaugeX, gaugeY, gaugeWidth, gaugeHeight);
        
        // Calculate fill percentage
        const fillPercentage = this.player.energy / this.player.maxEnergy;
        
        // Choose color based on energy level
        if (this.player.energy <= 20) {
            this.ctx.fillStyle = '#FF1100';  // Red for low energy
        } else if (this.player.energy >= this.player.maxEnergy) {
            this.ctx.fillStyle = '#89F336';  // Green for full energy
        } else {
            this.ctx.fillStyle = '#00B4D8';  // Blue for normal energy
        }
        
        // Draw energy bar
        this.ctx.fillRect(gaugeX, gaugeY, gaugeWidth * fillPercentage, gaugeHeight);
        
        // Draw boost text
        this.ctx.font = '16px Bungee';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('BOOST', gaugeX, gaugeY - 5);

        // Draw Commands Guide in bottom right with adjusted dimensions
        const commandX = this.width - 200;  // Adjusted position
        const commandY = this.height - 160;  // Adjusted position
        
        // Draw semi-transparent background with compact dimensions
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(commandX - 10, commandY - 25, 190, 145);  // Adjusted size to be more compact
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.strokeRect(commandX - 10, commandY - 25, 190, 145);
        
        // Draw title with adjusted position
        this.ctx.font = '20px Bungee';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('CONTROLS', commandX + 85, commandY);
        
        // Draw commands list with compact spacing
        this.ctx.font = '14px Bungee';  // Slightly smaller font
        this.ctx.fillStyle = '#AAAAAA';
        this.ctx.textAlign = 'left';
        const commands = [
            '↑/↓ - MOVE UP/DOWN',
            'SHIFT - BOOST',
            'E - SHOOT',
            'ESC - RETURN TO MENU',
            'R - RESTART GAME'
        ];
        
        // Draw each command with tighter spacing
        commands.forEach((command, index) => {
            this.ctx.fillText(command, commandX, commandY + 25 + (index * 22));  // Reduced spacing
        });

        this.ctx.restore();
    }

    drawGameOver() {
        // Play appropriate sound based on game outcome
        if (!this.gameOverSoundPlayed) {
            if (this.isWinner) {
                this.playSound('victory');
            } else {
                this.playSound('gameOver');
            }
            this.gameOverSoundPlayed = true;
        }

        // Update high score if current score is higher
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
        }

        // When game over, fade out game music and start menu music
        if (this.gameMusic.volume > 0) {
            this.fadeOutMusic(this.gameMusic);
            this.menuMusic.play().catch(error => console.log("Menu audio play failed:", error));
            this.fadeInMusic(this.menuMusic);
        }

        this.ctx.save();
        
        // Add semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        if (this.isWinner) {
            // Draw victory text with glow effect
            this.ctx.font = '48px Bungee';
            this.ctx.textAlign = 'center';
            
            // Add glow effect
            const glowSize = Math.sin(Date.now() * 0.005) * 2;
            this.ctx.shadowColor = '#00FF00';
            this.ctx.shadowBlur = 15 + glowSize;
            this.ctx.fillStyle = '#89F336';
            this.ctx.fillText('Victory!', this.width * 0.5, this.height * 0.4);
        } else {
            // Draw game over text with glow effect
            this.ctx.font = '48px Bungee';
            this.ctx.textAlign = 'center';
            
            // Add glow effect
            const glowSize = Math.sin(Date.now() * 0.005) * 2;
            this.ctx.shadowColor = '#FF0000';
            this.ctx.shadowBlur = 15 + glowSize;
            this.ctx.fillStyle = '#FF1100';
            this.ctx.fillText('Game Over', this.width * 0.5, this.height * 0.4);
        }

        // Draw score
        this.ctx.font = '24px Bungee';
        this.ctx.shadowBlur = 10;
        this.ctx.fillStyle = '#89F336';
        this.ctx.fillText(`Score: ${this.score}`, this.width * 0.5, this.height * 0.5);
        
        // Draw time
        this.ctx.fillStyle = '#00B4D8';
        this.ctx.fillText(`Time: ${this.formatTimer()}s`, this.width * 0.5, this.height * 0.5 + 40);

        // Draw restart instruction with pulsing effect
        this.ctx.font = '20px Bungee';
        const alpha = (Math.sin(Date.now() * 0.005) + 1) * 0.5;
        this.ctx.fillStyle = `rgba(255, 255, 255, ${0.5 + alpha * 0.5})`;
        this.ctx.shadowBlur = 0;
        this.ctx.fillText("Press 'R' to return to menu", this.width * 0.5, this.height * 0.6);
        
        this.ctx.restore();
    }

    checkCollision(a, b) {
        const dx = a.collisionX - b.collisionX;
        const dy = a.collisionY - b.collisionY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const sumOfRadii = a.collisionRadius + b.collisionRadius;
        const hasCollided = distance <= sumOfRadii;
        
        if (hasCollided) {
            this.playSound('hit');
        }
        
        return hasCollided;
    }

    handleMenuSelection() {
        this.playSound('menuSelect');
        switch(this.menuItems[this.selectedMenuItem]) {
            case 'Start Game':
                this.gameStarted = true;
                this.gameOver = false;
                // Apply difficulty settings
                const settings = this.difficultySettings[this.difficulties[this.selectedDifficulty]];
                this.eventInterval = settings.spawnInterval;
                this.numberOfEnemys = settings.enemyCount;
                // Transition music
                this.fadeOutMusic(this.menuMusic);
                this.gameMusic.play().catch(error => console.log("Game audio play failed:", error));
                this.fadeInMusic(this.gameMusic);
                this.resize(window.innerWidth, window.innerHeight);
                break;
            case 'Difficulty':
                this.showingDifficulty = true;
                break;
            case 'Controls':
                this.showingControls = true;
                break;
            case 'Exit':
                // Could redirect to another page or close the game
                break;
        }
    }

    handleMenuHover(mouseX, mouseY) {
        if (this.showingDifficulty) {
            const startY = this.height * 0.4;
            const spacing = 60;
            const itemHeight = 40;
            const itemWidth = 250;
            const menuCenterX = this.width * 0.5;

            this.difficultyHoverIndex = -1;
            
            this.difficulties.forEach((item, index) => {
                const itemY = startY + (index * spacing) - itemHeight/2;
                if (mouseX > menuCenterX - itemWidth/2 &&
                    mouseX < menuCenterX + itemWidth/2 &&
                    mouseY > itemY &&
                    mouseY < itemY + itemHeight) {
                    this.difficultyHoverIndex = index;
                    if (this.difficultyHoverIndex !== this.selectedDifficulty) {
                        this.playSound('menuHover');
                    }
                }
            });
            return;
        }
        const previousHoverIndex = this.menuHoverIndex;
        const menuY = this.height * 0.5;
        const menuSpacing = 50;
        const itemHeight = 30;
        const itemWidth = 200;
        const menuCenterX = this.width * 0.5;

        this.menuHoverIndex = -1;
        
        this.menuItems.forEach((item, index) => {
            const itemY = menuY + (index * menuSpacing) - itemHeight/2;
            if (mouseX > menuCenterX - itemWidth/2 &&
                mouseX < menuCenterX + itemWidth/2 &&
                mouseY > itemY &&
                mouseY < itemY + itemHeight) {
                this.menuHoverIndex = index;
            }
        });
        
        // Play hover sound if hovering over a new item
        if (this.menuHoverIndex !== -1 && this.menuHoverIndex !== previousHoverIndex) {
            this.playSound('menuHover');
        }
    }

    handleMenuClick(mouseX, mouseY) {
        if (this.showingDifficulty) {
            const startY = this.height * 0.4;
            const spacing = 60;
            const itemHeight = 40;
            const itemWidth = 250;
            const menuCenterX = this.width * 0.5;

            this.difficulties.forEach((item, index) => {
                const itemY = startY + (index * spacing) - itemHeight/2;
                if (mouseX > menuCenterX - itemWidth/2 &&
                    mouseX < menuCenterX + itemWidth/2 &&
                    mouseY > itemY &&
                    mouseY < itemY + itemHeight) {
                    this.selectedDifficulty = index;
                    this.showingDifficulty = false;
                    this.playSound('menuSelect');
                }
            });
            return;
        }
        const menuY = this.height * 0.5;
        const menuSpacing = 50;
        const itemHeight = 30;
        const itemWidth = 200;
        const menuCenterX = this.width * 0.5;

        this.menuItems.forEach((item, index) => {
            const itemY = menuY + (index * menuSpacing) - itemHeight/2;
            if (mouseX > menuCenterX - itemWidth/2 &&
                mouseX < menuCenterX + itemWidth/2 &&
                mouseY > itemY &&
                mouseY < itemY + itemHeight) {
                this.selectedMenuItem = index;
                this.handleMenuSelection();
            }
        });
    }

    drawMenu() {
        // Draw semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        // Draw game title with floating animation
        this.ctx.save();
        this.ctx.font = '48px Bungee';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        const titleY = this.height * 0.3 + Math.sin(Date.now() * 0.002) * 5; // Floating effect
        this.ctx.fillText('SPACE GAME', this.width * 0.5, titleY);

        // Draw high score box
        const boxWidth = 200;
        const boxHeight = 80;
        const boxX = this.width * 0.5 - boxWidth / 2;
        const boxY = titleY + 40;

        // Draw semi-transparent background for high score
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(boxX, boxY, boxWidth, boxHeight);
        this.ctx.strokeStyle = '#89F336';  // Green border
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(boxX, boxY, boxWidth, boxHeight);

        // Draw high score text with glow effect
        this.ctx.font = '20px Bungee';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('HIGH SCORE', this.width * 0.5, boxY + 30);
        
        this.ctx.font = '24px Bungee';
        this.ctx.fillStyle = '#89F336';  // Green color for score
        const glowSize = Math.sin(Date.now() * 0.005) * 2;
        this.ctx.shadowColor = '#00FF00';
        this.ctx.shadowBlur = 10 + glowSize;
        this.ctx.fillText(this.highScore.toString(), this.width * 0.5, boxY + 60);

        // Draw menu items
        const menuY = this.height * 0.5;
        const menuSpacing = 50;
        const itemWidth = 200;
        const itemHeight = 30;

        this.menuItems.forEach((item, index) => {
            const itemY = menuY + (index * menuSpacing);
            const animation = this.menuAnimations[index];
            
            this.ctx.save();
            // Apply scale transformation
            this.ctx.translate(this.width * 0.5, itemY);
            this.ctx.scale(animation.scale, animation.scale);
            this.ctx.translate(-this.width * 0.5, -itemY);
            
            // Draw button background when hovered
            if (index === this.menuHoverIndex) {
                const glowIntensity = (Math.sin(Date.now() * 0.005) + 1) * 0.5; // Pulsing glow
                this.ctx.fillStyle = `rgba(255, 255, 255, ${0.1 + glowIntensity * 0.1})`;
                this.ctx.fillRect(
                    this.width * 0.5 - (itemWidth * animation.scale)/2,
                    itemY - (itemHeight * animation.scale)/2,
                    itemWidth * animation.scale,
                    itemHeight * animation.scale
                );
            }

            // Draw text with color transitions
            this.ctx.font = '24px Bungee';
            if (index === this.selectedMenuItem) {
                const selectedColor = '#89F336';
                const glowColor = '#00FF00';
                const glowSize = Math.sin(Date.now() * 0.005) * 2; // Pulsing effect
                
                // Draw glow effect
                this.ctx.shadowColor = glowColor;
                this.ctx.shadowBlur = 10 + glowSize;
                this.ctx.fillStyle = selectedColor;
                this.ctx.fillText('> ' + item + ' <', this.width * 0.5, itemY);
            } else if (index === this.menuHoverIndex) {
                const baseColor = [0, 180, 216]; // #00B4D8
                const pulseIntensity = (Math.sin(Date.now() * 0.005) + 1) * 0.5;
                const r = baseColor[0] + pulseIntensity * 20;
                const g = baseColor[1] + pulseIntensity * 20;
                const b = baseColor[2] + pulseIntensity * 20;
                this.ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
                this.ctx.fillText(item, this.width * 0.5, itemY);
            } else {
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillText(item, this.width * 0.5, itemY);
            }
            
            this.ctx.restore();
        });

        // Draw instructions with fade effect
        this.ctx.font = '16px Bungee';
        const instructionAlpha = (Math.sin(Date.now() * 0.002) + 1) * 0.5; // Fading effect
        this.ctx.fillStyle = `rgba(170, 170, 170, ${0.5 + instructionAlpha * 0.5})`;
        this.ctx.fillText('Use mouse or ↑↓ to select and click or ENTER to confirm', this.width * 0.5, this.height * 0.8);
        
        this.ctx.restore();
    }

    drawControlsScreen() {
        // Draw semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.save();
        
        // Draw title
        this.ctx.font = '36px Bungee';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('GAME CONTROLS', this.width * 0.5, this.height * 0.2);

        // Draw controls in a nice layout
        const controlsX = this.width * 0.5;
        const startY = this.height * 0.3;
        const spacing = 40;
        
        const controls = [
            { key: '↑/↓', action: 'Move Up/Down', color: '#89F336' },
            { key: 'SHIFT', action: 'Activate Boost', color: '#00B4D8' },
            { key: 'E', action: 'Shoot Enemies', color: '#FF1100' },
            { key: 'ESC', action: 'Return to Menu', color: '#FFFFFF' },
            { key: 'R', action: 'Restart Game', color: '#FFFFFF' },
            { key: 'M', action: 'Toggle Music', color: '#FFFFFF' },
            { key: 'D', action: 'Toggle Debug', color: '#AAAAAA' }
        ];

        // Draw each control with a nice layout
        controls.forEach((control, index) => {
            const y = startY + (spacing * index);
            
            // Draw key background
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            const keyWidth = 100;
            const keyX = controlsX - 150;
            this.ctx.fillRect(keyX, y - 20, keyWidth, 30);
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            this.ctx.strokeRect(keyX, y - 20, keyWidth, 30);

            // Draw key text
            this.ctx.font = '18px Bungee';
            this.ctx.fillStyle = control.color;
            this.ctx.textAlign = 'center';
            this.ctx.fillText(control.key, keyX + keyWidth/2, y + 5);

            // Draw action text
            this.ctx.fillStyle = '#FFFFFF';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(control.action, controlsX, y + 5);
        });

        // Draw return instruction
        this.ctx.font = '16px Bungee';
        this.ctx.fillStyle = '#AAAAAA';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Press ESC to return to menu', this.width * 0.5, this.height * 0.8);

        this.ctx.restore();
    }

    drawDifficultyScreen() {
        // Draw semi-transparent overlay
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(0, 0, this.width, this.height);

        this.ctx.save();
        
        // Draw title
        this.ctx.font = '36px Bungee';
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('SELECT DIFFICULTY', this.width * 0.5, this.height * 0.2);

        // Draw difficulty options
        const startY = this.height * 0.4;
        const spacing = 60;
        const itemWidth = 250;
        const itemHeight = 40;

        this.difficulties.forEach((diff, index) => {
            const y = startY + (index * spacing);
            
            // Draw button background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            const buttonX = this.width * 0.5 - itemWidth/2;
            this.ctx.fillRect(buttonX, y - itemHeight/2, itemWidth, itemHeight);
            
            // Draw border with different colors based on selection/hover
            if (index === this.selectedDifficulty) {
                this.ctx.strokeStyle = '#89F336';  // Green for selected
                this.ctx.lineWidth = 3;
            } else if (index === this.difficultyHoverIndex) {
                this.ctx.strokeStyle = '#00B4D8';  // Blue for hover
                this.ctx.lineWidth = 2;
            } else {
                this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                this.ctx.lineWidth = 1;
            }
            this.ctx.strokeRect(buttonX, y - itemHeight/2, itemWidth, itemHeight);

            // Draw difficulty text
            this.ctx.font = '24px Bungee';
            if (index === this.selectedDifficulty) {
                const glowSize = Math.sin(Date.now() * 0.005) * 2;
                this.ctx.shadowColor = '#00FF00';
                this.ctx.shadowBlur = 10 + glowSize;
                this.ctx.fillStyle = '#89F336';
                this.ctx.fillText('> ' + diff + ' <', this.width * 0.5, y + 8);
            } else if (index === this.difficultyHoverIndex) {
                this.ctx.fillStyle = '#00B4D8';
                this.ctx.fillText(diff, this.width * 0.5, y + 8);
            } else {
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillText(diff, this.width * 0.5, y + 8);
            }

            // Draw difficulty details
            const settings = this.difficultySettings[diff];
            this.ctx.font = '14px Bungee';
            this.ctx.fillStyle = '#AAAAAA';
            this.ctx.fillText(`Score to Win: ${settings.scoreToWin} | Enemies: ${settings.enemyCount}`, 
                this.width * 0.5, y + 35);
        });

        // Draw return instruction
        this.ctx.font = '16px Bungee';
        this.ctx.fillStyle = '#AAAAAA';
        this.ctx.shadowBlur = 0;
        this.ctx.fillText('Press ESC to return to menu', this.width * 0.5, this.height * 0.8);

        this.ctx.restore();
    }

    updateMenuAnimations(deltaTime) {
        const animationSpeed = 0.015;
        this.menuAnimations.forEach((anim, index) => {
            // Update scale
            if (index === this.menuHoverIndex || index === this.selectedMenuItem) {
                anim.targetScale = 1.1;
                anim.targetAlpha = 1;
            } else {
                anim.targetScale = 1;
                anim.targetAlpha = 0;
            }

            // Smoothly interpolate scale and alpha
            anim.scale += (anim.targetScale - anim.scale) * animationSpeed * deltaTime;
            anim.alpha += (anim.targetAlpha - anim.alpha) * animationSpeed * deltaTime;
        });
    }

    playSound(soundName) {
        if (!this.isMuted && this.sounds[soundName]) {
            const sound = this.sounds[soundName].cloneNode();
            sound.volume = 0.3;  // Set a reasonable volume
            sound.play().catch(error => console.log(`Sound play failed: ${soundName}`, error));
        }
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        if (this.isMuted) {
            this.menuMusic.volume = 0;
            this.gameMusic.volume = 0;
            Object.values(this.sounds).forEach(sound => {
                sound.muted = true;
            });
        } else {
            if (!this.gameStarted) {
                this.fadeInMusic(this.menuMusic);
            } else {
                this.fadeInMusic(this.gameMusic);
            }
            Object.values(this.sounds).forEach(sound => {
                sound.muted = false;
            });
        }
    }

    fadeInMusic(audioElement) {
        if (!this.isMuted && audioElement.volume < this.targetMenuVolume) {
            audioElement.volume = Math.min(audioElement.volume + this.musicFadeSpeed, this.targetMenuVolume);
            requestAnimationFrame(() => this.fadeInMusic(audioElement));
        }
    }

    fadeOutMusic(audioElement) {
        if (audioElement.volume > 0) {
            audioElement.volume = Math.max(audioElement.volume - this.musicFadeSpeed, 0);
            requestAnimationFrame(() => this.fadeOutMusic(audioElement));
        } else {
            audioElement.pause();
            audioElement.currentTime = 0;
        }
    }
}

window.addEventListener('load', function () {
    const canvas = document.getElementById('game-layout');
    const ctx = canvas.getContext('2d');
    canvas.width = 720;
    canvas.height = 720;

    const game = new Game(canvas, ctx);

    let lastTime = 0;
    function animate(timeStamp) {
        const deltaTime = timeStamp - lastTime;
        lastTime = timeStamp;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        game.render(deltaTime);
        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);
});