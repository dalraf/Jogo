class ColetoraGuarani {
    constructor() {
        this.gameState = 'start'; // start, playing, paused, gameOver
        this.score = 0;
        this.moneyCount = 0;
        this.phoneCount = 0;
        this.playerPosition = { x: 0, y: 0 };
        this.collectibles = [];
        this.gameArea = null;
        this.player = null;
        this.bankChaser = null;
        this.bankPosition = { x: 0, y: 0 };
        this.keys = {};
        this.touchStart = null;
        this.spawnInterval = null;
        this.gameTimer = null;
        this.bankTimer = null;
        this.gameDuration = 60; // segundos
        this.timeLeft = this.gameDuration;
        this.running = false;
        this.lastBankAttack = 0;
        this.bankAttackCooldown = 2000; // 2 segundos entre ataques
        
        this.init();
    }

    init() {
        this.setupElements();
        this.setupEventListeners();
        this.setupMobileControls();
        this.centerPlayer();
        
        // Inicia com a tela de menu
        this.showScreen('start');
    }

    setupElements() {
        this.gameArea = document.getElementById('game-area');
        this.player = document.getElementById('player');
        this.bankChaser = document.getElementById('bank-chaser');
        
        // Elementos de UI
        this.moneyScore = document.getElementById('money-score');
        this.phoneScore = document.getElementById('phone-score');
        this.totalScore = document.getElementById('total-score');
        
        // Telas
        this.screens = {
            start: document.getElementById('start-screen'),
            game: document.getElementById('game-screen'),
            pause: document.getElementById('pause-screen'),
            gameOver: document.getElementById('game-over-screen')
        };

        // Botões
        this.startBtn = document.getElementById('start-btn');
        this.pauseBtn = document.getElementById('pause-btn');
        this.resumeBtn = document.getElementById('resume-btn');
        this.restartBtn = document.getElementById('restart-btn');
        this.menuBtn = document.getElementById('menu-btn');
        this.playAgainBtn = document.getElementById('play-again-btn');
        this.backToMenuBtn = document.getElementById('back-to-menu-btn');
    }

    setupEventListeners() {
        // Botões principais
        this.startBtn.addEventListener('click', () => this.startGame());
        this.pauseBtn.addEventListener('click', () => this.pauseGame());
        this.resumeBtn.addEventListener('click', () => this.resumeGame());
        this.restartBtn.addEventListener('click', () => this.restartGame());
        this.menuBtn.addEventListener('click', () => this.showMenu());
        this.playAgainBtn.addEventListener('click', () => this.restartGame());
        this.backToMenuBtn.addEventListener('click', () => this.showMenu());

        // Controles de teclado
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Controles de toque
        this.gameArea.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.gameArea.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.gameArea.addEventListener('touchend', (e) => this.handleTouchEnd(e));

        // Prevenir scroll no mobile
        document.addEventListener('touchmove', (e) => {
            if (this.gameState === 'playing') {
                e.preventDefault();
            }
        }, { passive: false });

        // Responsividade
        window.addEventListener('resize', () => this.handleResize());
    }

    setupMobileControls() {
        // Adicionar controles de toque visuais
        if (this.isMobile()) {
            this.createMobileControls();
        }
    }

    createMobileControls() {
        // Remover controles anteriores se existirem
        const existingControls = document.querySelector('.mobile-controls');
        if (existingControls) {
            existingControls.remove();
        }
        
        const controlsContainer = document.createElement('div');
        controlsContainer.className = 'mobile-controls';

        const directions = [
            { icon: '⬆️', dx: 0, dy: -1, label: 'cima' },
            { icon: '⬅️', dx: -1, dy: 0, label: 'esquerda' },
            { icon: '⬇️', dx: 0, dy: 1, label: 'baixo' },
            { icon: '➡️', dx: 1, dy: 0, label: 'direita' }
        ];

        // Criar direcional circular
        const directionalPad = document.createElement('div');
        directionalPad.style.cssText = `
            display: grid;
            grid-template-columns: 1fr 1fr 1fr;
            grid-template-rows: 1fr 1fr 1fr;
            gap: 5px;
            padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            backdrop-filter: blur(10px);
        `;

        // Adicionar botões na posição correta
        const positions = {
            'cima': { row: 0, col: 1 },
            'esquerda': { row: 1, col: 0 },
            'baixo': { row: 2, col: 1 },
            'direita': { row: 1, col: 2 }
        };

        directions.forEach(dir => {
            const pos = positions[dir.label];
            const btn = document.createElement('button');
            btn.textContent = dir.icon;
            btn.style.cssText = `
                grid-row: ${pos.row + 1};
                grid-column: ${pos.col + 1};
                width: 45px;
                height: 45px;
                font-size: 18px;
                border-radius: 50%;
                border: 2px solid rgba(255, 255, 255, 0.3);
                background: rgba(255, 255, 255, 0.8);
                backdrop-filter: blur(10px);
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
                cursor: pointer;
                touch-action: manipulation;
                transition: all 0.2s ease;
                display: flex;
                align-items: center;
                justify-content: center;
            `;
            
            // Adicionar repetição para movimento contínuo
            let repeatInterval = null;
            const startRepeat = () => {
                this.movePlayer(dir.dx * 60, dir.dy * 60);
                repeatInterval = setInterval(() => {
                    this.movePlayer(dir.dx * 60, dir.dy * 60);
                }, 150);
            };
            
            const stopRepeat = () => {
                if (repeatInterval) {
                    clearInterval(repeatInterval);
                    repeatInterval = null;
                }
            };
            
            btn.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.showMobileFeedback(dir.label);
                startRepeat();
            });
            
            btn.addEventListener('touchend', (e) => {
                e.preventDefault();
                stopRepeat();
            });
            
            btn.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                stopRepeat();
            });
            
            btn.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.showMobileFeedback(dir.label);
                startRepeat();
            });
            
            btn.addEventListener('mouseup', (e) => {
                e.preventDefault();
                stopRepeat();
            });
            
            btn.addEventListener('mouseleave', (e) => {
                stopRepeat();
            });
            
            directionalPad.appendChild(btn);
        });

        controlsContainer.appendChild(directionalPad);
        document.body.appendChild(controlsContainer);
    }

    showMobileFeedback(direction) {
        // Feedback visual para mobile
        const feedback = document.createElement('div');
        feedback.className = 'mobile-feedback';
        feedback.textContent = `Movendo: ${direction}`;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
            }
        }, 500);
    }

    updateMobileControlsVisibility() {
        const controls = document.querySelector('.mobile-controls');
        if (controls) {
            if (this.isMobile() && this.gameState === 'playing') {
                controls.style.display = 'flex';
            } else {
                controls.style.display = 'none';
            }
        }
    }

    startGame() {
        this.gameState = 'playing';
        this.score = 0;
        this.moneyCount = 0;
        this.phoneCount = 0;
        this.timeLeft = this.gameDuration;
        this.lastBankAttack = 0;
        
        // Limpar itens existentes
        this.clearCollectibles();
        
        // Mostrar tela do jogo
        this.showScreen('game');
        
        // Centralizar jogador
        this.centerPlayer();
        
        // Inicializar banco perseguidor
        this.initializeBankChaser();
        
        // Iniciar spawns
        this.startSpawning();
        
        // Iniciar timer
        this.startTimer();
        
        // Iniciar perseguição do banco
        this.startBankChasing();
        
        // Atualizar UI
        this.updateScore();
        
        this.running = true;
        
        // Mostrar controles mobile se necessário
        this.updateMobileControlsVisibility();
        
        // Adicionar classe de animação
        this.player.classList.add('bounce-in');
        setTimeout(() => this.player.classList.remove('bounce-in'), 500);
    }

    pauseGame() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            this.stopSpawning();
            this.stopTimer();
            this.updatePauseScreen();
            this.updateMobileControlsVisibility();
            this.showScreen('pause');
        }
    }

    resumeGame() {
        if (this.gameState === 'paused') {
            this.gameState = 'playing';
            this.startSpawning();
            this.startTimer();
            this.updateMobileControlsVisibility();
            this.showScreen('game');
        }
    }

    restartGame() {
        this.stopSpawning();
        this.stopTimer();
        this.startGame();
    }

    showMenu() {
        this.gameState = 'start';
        this.running = false;
        this.stopSpawning();
        this.stopTimer();
        this.showScreen('start');
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            screen.classList.remove('active');
        });
        if (this.screens[screenName]) {
            this.screens[screenName].classList.add('active');
        }
    }

    centerPlayer() {
        if (!this.gameArea || !this.player) return;
        
        const gameRect = this.gameArea.getBoundingClientRect();
        const playerSize = this.player.offsetWidth;
        
        this.playerPosition.x = (gameRect.width - playerSize) / 2;
        this.playerPosition.y = (gameRect.height - playerSize) / 2;
        
        this.updatePlayerPosition();
    }

    updatePlayerPosition() {
        if (this.player) {
            this.player.style.left = `${this.playerPosition.x}px`;
            this.player.style.top = `${this.playerPosition.y}px`;
        }
    }

    movePlayer(dx, dy) {
        if (!this.running) return;
        
        const speed = this.isMobile() ? 60 : 80;
        const moveDistance = speed;
        
        let newX = this.playerPosition.x;
        let newY = this.playerPosition.y;
        
        if (dx > 0) newX += moveDistance;
        if (dx < 0) newX -= moveDistance;
        if (dy > 0) newY += moveDistance;
        if (dy < 0) newY -= moveDistance;
        
        // Limites da tela
        const maxX = this.gameArea.clientWidth - this.player.offsetWidth;
        const maxY = this.gameArea.clientHeight - this.player.offsetHeight;
        
        this.playerPosition.x = Math.max(0, Math.min(newX, maxX));
        this.playerPosition.y = Math.max(0, Math.min(newY, maxY));
        
        this.updatePlayerPosition();
        
        // Animação de movimento
        this.player.classList.add('moving');
        setTimeout(() => this.player.classList.remove('moving'), 150);
        
        // Verificar colisões
        this.checkCollisions();
    }

    handleKeyDown(e) {
        if (!this.running) return;
        
        this.keys[e.key.toLowerCase()] = true;
        
        switch(e.key.toLowerCase()) {
            case 'arrowleft':
            case 'a':
                this.movePlayer(-1, 0);
                e.preventDefault();
                break;
            case 'arrowright':
            case 'd':
                this.movePlayer(1, 0);
                e.preventDefault();
                break;
            case 'arrowup':
            case 'w':
                this.movePlayer(0, -1);
                e.preventDefault();
                break;
            case 'arrowdown':
            case 's':
                this.movePlayer(0, 1);
                e.preventDefault();
                break;
            case ' ':
                e.preventDefault();
                break;
        }
    }

    handleKeyUp(e) {
        this.keys[e.key.toLowerCase()] = false;
    }

    handleTouchStart(e) {
        if (this.gameState !== 'playing') return;
        
        const touch = e.touches[0];
        const gameRect = this.gameArea.getBoundingClientRect();
        const playerRect = this.player.getBoundingClientRect();
        
        this.touchStart = {
            x: touch.clientX,
            y: touch.clientY,
            playerX: playerRect.left - gameRect.left + playerRect.width / 2,
            playerY: playerRect.top - gameRect.top + playerRect.height / 2
        };
    }

    handleTouchMove(e) {
        if (!this.touchStart || this.gameState !== 'playing') return;
        
        e.preventDefault();
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.touchStart.x;
        const deltaY = touch.clientY - this.touchStart.y;
        
        const gameRect = this.gameArea.getBoundingClientRect();
        const playerRect = this.player.getBoundingClientRect();
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        
        if (distance > 15) {
            const angle = Math.atan2(deltaY, deltaX);
            const moveDistance = Math.min(distance * 0.4, 80); // Movimento mais suave
            
            const newX = this.touchStart.playerX + Math.cos(angle) * moveDistance;
            const newY = this.touchStart.playerY + Math.sin(angle) * moveDistance;
            
            const maxX = this.gameArea.clientWidth - playerRect.width;
            const maxY = this.gameArea.clientHeight - playerRect.height;
            
            this.playerPosition.x = Math.max(0, Math.min(newX - playerRect.width / 2, maxX));
            this.playerPosition.y = Math.max(0, Math.min(newY - playerRect.height / 2, maxY));
            
            this.updatePlayerPosition();
            this.checkCollisions();
        }
    }

    handleTouchEnd(e) {
        this.touchStart = null;
    }

    spawnCollectible() {
        if (!this.running || this.gameState !== 'playing') return;
        
        const type = Math.random() > 0.7 ? 'phone' : 'money';
        const element = document.createElement('div');
        element.className = `collectible ${type}`;
        element.dataset.type = type;
        element.textContent = type === 'money' ? '💰' : '📱';
        
        // Posição aleatória
        const gameRect = this.gameArea.getBoundingClientRect();
        const elementSize = 40;
        const padding = 50;
        
        let x, y, attempts = 0;
        do {
            x = padding + Math.random() * (gameRect.width - padding * 2 - elementSize);
            y = padding + Math.random() * (gameRect.height - padding * 2 - elementSize);
            attempts++;
        } while (attempts < 10 && this.isNearPlayer(x, y, 80));
        
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
        
        this.gameArea.appendChild(element);
        
        const collectible = {
            element: element,
            x: x,
            y: y,
            type: type,
            collected: false
        };
        
        this.collectibles.push(collectible);
        
        // Remover após 8 segundos se não coletado
        setTimeout(() => {
            if (!collectible.collected) {
                this.removeCollectible(collectible);
            }
        }, 8000);
    }

    isNearPlayer(x, y, minDistance) {
        const playerCenterX = this.playerPosition.x + this.player.offsetWidth / 2;
        const playerCenterY = this.playerPosition.y + this.player.offsetHeight / 2;
        const itemCenterX = x + 20;
        const itemCenterY = y + 20;
        
        const distance = Math.sqrt(
            Math.pow(playerCenterX - itemCenterX, 2) + 
            Math.pow(playerCenterY - itemCenterY, 2)
        );
        
        return distance < minDistance;
    }

    checkCollisions() {
        if (!this.running) return;
        
        const playerRect = this.player.getBoundingClientRect();
        const playerCenterX = playerRect.left + playerRect.width / 2;
        const playerCenterY = playerRect.top + playerRect.height / 2;
        
        // Verificar colisões com itens colecionáveis
        this.collectibles.forEach(collectible => {
            if (collectible.collected) return;
            
            const itemRect = collectible.element.getBoundingClientRect();
            const itemCenterX = itemRect.left + itemRect.width / 2;
            const itemCenterY = itemRect.top + itemRect.height / 2;
            
            const distance = Math.sqrt(
                Math.pow(playerCenterX - itemCenterX, 2) + 
                Math.pow(playerCenterY - itemCenterY, 2)
            );
            
            if (distance < 50) {
                this.collectItem(collectible);
            }
        });
        
        // Verificar colisão com banco perseguidor
        this.checkBankCollision();
    }

    collectItem(collectible) {
        collectible.collected = true;
        collectible.element.classList.add('collected');
        
        // Atualizar pontuação
        const points = collectible.type === 'money' ? 10 : 25;
        this.score += points;
        
        if (collectible.type === 'money') {
            this.moneyCount++;
        } else {
            this.phoneCount++;
        }
        
        this.updateScore();
        
        // Efeito visual
        this.createCollectEffect(collectible.x + 20, collectible.y + 20, points);
        
        // Remover item após animação
        setTimeout(() => {
            this.removeCollectible(collectible);
        }, 400);
        
        // Som de coleta (se implementado)
        this.playCollectSound();
    }

    createCollectEffect(x, y, points) {
        const effect = document.createElement('div');
        effect.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            font-size: 24px;
            font-weight: bold;
            color: #FFD700;
            pointer-events: none;
            z-index: 200;
            animation: scorePop 600ms ease-out forwards;
        `;
        effect.textContent = `+${points}`;
        
        this.gameArea.appendChild(effect);
        
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 600);
    }

    removeCollectible(collectible) {
        const index = this.collectibles.indexOf(collectible);
        if (index > -1) {
            this.collectibles.splice(index, 1);
        }
        if (collectible.element && collectible.element.parentNode) {
            collectible.element.parentNode.removeChild(collectible.element);
        }
    }

    clearCollectibles() {
        this.collectibles.forEach(collectible => {
            if (collectible.element && collectible.element.parentNode) {
                collectible.element.parentNode.removeChild(collectible.element);
            }
        });
        this.collectibles = [];
    }

    updateScore() {
        if (this.moneyScore) this.moneyScore.textContent = this.moneyCount;
        if (this.phoneScore) this.phoneScore.textContent = this.phoneCount;
        if (this.totalScore) this.totalScore.textContent = this.score;
        
        // Animação da pontuação
        document.querySelectorAll('.score-card .score, .score-card').forEach(element => {
            element.classList.add('score-animation');
            setTimeout(() => element.classList.remove('score-animation'), 300);
        });
    }

    updatePauseScreen() {
        document.getElementById('pause-money').textContent = this.moneyCount;
        document.getElementById('pause-phones').textContent = this.phoneCount;
        document.getElementById('pause-total').textContent = this.score;
    }

    startSpawning() {
        this.spawnInterval = setInterval(() => {
            // Spawn até 3 itens simultaneamente
            const maxItems = Math.min(3, 1 + Math.floor(this.score / 100));
            const itemsToSpawn = Math.floor(Math.random() * maxItems) + 1;
            
            for (let i = 0; i < itemsToSpawn; i++) {
                setTimeout(() => this.spawnCollectible(), i * 200);
            }
        }, 1500);
    }

    stopSpawning() {
        if (this.spawnInterval) {
            clearInterval(this.spawnInterval);
            this.spawnInterval = null;
        }
    }

    // Banco perseguidor
    initializeBankChaser() {
        if (!this.bankChaser) return;
        
        // Posicionar banco longe do jogador inicialmente
        const gameRect = this.gameArea.getBoundingClientRect();
        const margin = 100;
        
        if (Math.random() > 0.5) {
            // Banco na borda esquerda
            this.bankPosition.x = margin;
            this.bankPosition.y = Math.random() * (gameRect.height - 100);
        } else {
            // Banco na borda direita
            this.bankPosition.x = gameRect.width - 100;
            this.bankPosition.y = Math.random() * (gameRect.height - 100);
        }
        
        this.updateBankPosition();
    }

    updateBankPosition() {
        if (this.bankChaser) {
            this.bankChaser.style.left = `${this.bankPosition.x}px`;
            this.bankChaser.style.top = `${this.bankPosition.y}px`;
        }
    }

    startBankChasing() {
        this.bankTimer = setInterval(() => {
            if (this.gameState !== 'playing') return;
            
            this.moveBankChaser();
        }, 100); // Movimento suave a cada 100ms
    }

    stopBankChasing() {
        if (this.bankTimer) {
            clearInterval(this.bankTimer);
            this.bankTimer = null;
        }
    }

    moveBankChaser() {
        if (!this.running || !this.bankChaser) return;
        
        const playerCenterX = this.playerPosition.x + this.player.offsetWidth / 2;
        const playerCenterY = this.playerPosition.y + this.player.offsetHeight / 2;
        const bankCenterX = this.bankPosition.x + 25;
        const bankCenterY = this.bankPosition.y + 25;
        
        // Calcular direção para o jogador
        const dx = playerCenterX - bankCenterX;
        const dy = playerCenterY - bankCenterY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Velocidade do banco (ligeiramente mais lenta que o jogador)
        const speed = this.isMobile() ? 1.5 : 2;
        
        if (distance > 5) {
            // Mover banco em direção ao jogador
            this.bankPosition.x += (dx / distance) * speed;
            this.bankPosition.y += (dy / distance) * speed;
            
            // Limites da tela
            const maxX = this.gameArea.clientWidth - 50;
            const maxY = this.gameArea.clientHeight - 50;
            
            this.bankPosition.x = Math.max(0, Math.min(this.bankPosition.x, maxX));
            this.bankPosition.y = Math.max(0, Math.min(this.bankPosition.y, maxY));
            
            this.updateBankPosition();
            
            // Adicionar classe de perseguição se estiver próximo
            if (distance < 200) {
                this.bankChaser.classList.add('pursuing');
                this.showBankWarning(true);
            } else {
                this.bankChaser.classList.remove('pursuing');
                this.showBankWarning(false);
            }
        }
    }

    checkBankCollision() {
        if (!this.bankChaser || !this.running) return;
        
        const now = Date.now();
        if (now - this.lastBankAttack < this.bankAttackCooldown) return;
        
        const playerRect = this.player.getBoundingClientRect();
        const bankRect = this.bankChaser.getBoundingClientRect();
        
        // Verificar sobreposição
        const overlap = !(
            playerRect.right < bankRect.left ||
            playerRect.left > bankRect.right ||
            playerRect.bottom < bankRect.top ||
            playerRect.top > bankRect.bottom
        );
        
        if (overlap) {
            this.bankAttack();
        }
    }

    bankAttack() {
        const now = Date.now();
        this.lastBankAttack = now;
        
        // Reduzir pontuação
        const deduction = Math.min(this.score, 15); // Máximo 15 pontos por ataque
        this.score = Math.max(0, this.score - deduction);
        
        // Atualizar contadores
        if (deduction > 0) {
            const moneyDeduction = Math.min(this.moneyCount, Math.floor(deduction / 10));
            const phoneDeduction = Math.floor((deduction - moneyDeduction * 10) / 25);
            
            this.moneyCount = Math.max(0, this.moneyCount - moneyDeduction);
            this.phoneCount = Math.max(0, this.phoneCount - phoneDeduction);
        }
        
        this.updateScore();
        
        // Efeito visual do ataque do banco
        this.createBankAttackEffect();
        
        // Som de ataque
        this.playBankAttackSound();
        
        // Animação de colisão
        this.bankChaser.classList.add('colliding');
        setTimeout(() => this.bankChaser.classList.remove('colliding'), 300);
        
        // Afastar banco temporariamente
        setTimeout(() => {
            this.repositionBank();
        }, 1000);
    }

    repositionBank() {
        const gameRect = this.gameArea.getBoundingClientRect();
        const margin = 80;
        
        // Reposicionar banco longe do jogador
        if (Math.random() > 0.5) {
            this.bankPosition.x = Math.random() * (gameRect.width - 100);
            this.bankPosition.y = margin;
        } else {
            this.bankPosition.x = Math.random() * (gameRect.width - 100);
            this.bankPosition.y = gameRect.height - 80;
        }
        
        this.updateBankPosition();
    }

    createBankAttackEffect() {
        const playerCenterX = this.playerPosition.x + this.player.offsetWidth / 2;
        const playerCenterY = this.playerPosition.y + this.player.offsetHeight / 2;
        
        const effect = document.createElement('div');
        effect.className = 'deduction-effect';
        effect.style.cssText = `
            position: absolute;
            left: ${playerCenterX - 20}px;
            top: ${playerCenterY - 20}px;
            font-size: 20px;
            font-weight: bold;
            color: var(--rojo-guarani-500);
            pointer-events: none;
            z-index: 200;
            animation: deductionFloat 1000ms ease-out forwards;
            text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
        `;
        effect.textContent = '-15';
        
        this.gameArea.appendChild(effect);
        
        // Remover após animação
        setTimeout(() => {
            if (effect.parentNode) {
                effect.parentNode.removeChild(effect);
            }
        }, 1000);
        
        // Adicionar efeito de tremer na pontuação
        document.querySelectorAll('.score-card').forEach(card => {
            card.classList.add('shake');
            setTimeout(() => card.classList.remove('shake'), 300);
        });
    }

    playBankAttackSound() {
        // Som de ataque do banco
        if (window.AudioContext || window.webkitAudioContext) {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(200, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(150, audioContext.currentTime + 0.2);
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.2);
            } catch (e) {
                // Silenciosamente falhar se não conseguir criar o som
            }
        }
    }

    showBankWarning(show) {
        const bankWarning = document.getElementById('bank-warning');
        if (bankWarning) {
            bankWarning.style.display = show ? 'inline' : 'none';
            
            if (show) {
                bankWarning.classList.add('warning-blink');
                setTimeout(() => bankWarning.classList.remove('warning-blink'), 300);
            }
        }
    }

    startTimer() {
        this.gameTimer = setInterval(() => {
            if (this.gameState !== 'playing') return;
            
            this.timeLeft--;
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 1000);
    }

    stopTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
            this.gameTimer = null;
        }
    }

    endGame() {
        this.gameState = 'gameOver';
        this.running = false;
        this.stopSpawning();
        this.stopTimer();
        this.stopBankChasing();
        
        // Atualizar tela final
        document.getElementById('final-money').textContent = this.moneyCount;
        document.getElementById('final-phones').textContent = this.phoneCount;
        document.getElementById('final-score').textContent = this.score;
        
        // Determinar conquista
        const achievement = this.getAchievement();
        document.getElementById('achievement').textContent = achievement;
        
        this.showScreen('gameOver');
        
        // Efeito final
        this.player.classList.add('glow');
        setTimeout(() => this.player.classList.remove('glow'), 2000);
    }

    getAchievement() {
        if (this.score >= 500) return '🏆 Coletora Mestre';
        if (this.score >= 300) return '🥇 Expert em Coletar';
        if (this.score >= 150) return '🥈 Coletora Experiente';
        if (this.score >= 50) return '🥉 Novata Promissora';
        return '👶 Coletora Iniciante';
    }

    playCollectSound() {
        // Placeholder para som - pode ser implementado com Web Audio API
        if (window.AudioContext || window.webkitAudioContext) {
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const oscillator = audioContext.createOscillator();
                const gainNode = audioContext.createGain();
                
                oscillator.connect(gainNode);
                gainNode.connect(audioContext.destination);
                
                oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1200, audioContext.currentTime + 0.1);
                
                gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                
                oscillator.start(audioContext.currentTime);
                oscillator.stop(audioContext.currentTime + 0.1);
            } catch (e) {
                // Silenciosamente falhar se não conseguir criar o som
            }
        }
    }

    handleResize() {
        // Reposicionar jogador se necessário
        if (this.gameState === 'playing') {
            const gameRect = this.gameArea.getBoundingClientRect();
            const playerRect = this.player.getBoundingClientRect();
            
            // Verificar se o jogador está fora dos limites
            if (playerRect.right > gameRect.right || playerRect.bottom > gameRect.bottom) {
                this.centerPlayer();
            }
        }
    }

    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }
}

// Inicializar o jogo quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new ColetoraGuarani();
});

// Prevenir zoom no mobile ao tocar duas vezes
let lastTouchEnd = 0;
document.addEventListener('touchend', function (event) {
    const now = (new Date()).getTime();
    if (now - lastTouchEnd <= 300) {
        event.preventDefault();
    }
    lastTouchEnd = now;
}, false);

// Prevenir menu de contexto
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});