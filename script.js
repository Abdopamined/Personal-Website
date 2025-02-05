// Constants and configurations
const CONFIG = {
    animation: {
        duration: 5900,
        interval: { min: 5000, max: 15000 },
        types: ['blink', 'happy', 'sad', 'angry', 'weird']
    },
    parallax: {
        strength: 50,
        rotation: 20
    },
    selectors: {
        musicControl: '.music-control',
        playIcon: '.play-icon',
        pauseIcon: '.pause-icon',
        mainContent: '.main-content',
        projectCard: '.project-card',
        projectRectangle: '.project-rectangle',
        openedRectangle: '.project-rectangle.opened'
    },
    audioSrc: 'Hytale OST - Traveling Band.mp3'
};

// Core application class
class App {
    constructor() {
        this.state = {
            isPlaying: false,
            isProjectOpen: false,
            animationInterval: null
        };
        this.elements = {};
        this.controllers = {};
    }

    init() {
        this.cacheElements();
        this.initControllers();
        this.startApplication();
    }

    cacheElements() {
        const { selectors } = CONFIG;
        this.elements = {
            musicControl: document.querySelector(selectors.musicControl),
            playIcon: document.querySelector(selectors.playIcon),
            pauseIcon: document.querySelector(selectors.pauseIcon),
            audio: new Audio(CONFIG.audioSrc),
            mainContent: document.querySelector(selectors.mainContent),
            projectCards: document.querySelectorAll(selectors.projectCard),
            projectRectangles: document.querySelectorAll(selectors.projectRectangle),
            overlay: this.createOverlay()
        };
    }

    createOverlay() {
        const overlay = document.createElement('div');
        overlay.className = 'overlay';
        document.body.appendChild(overlay);
        return overlay;
    }

    initControllers() {
        this.controllers = {
            music: new MusicController(this),
            animation: new AnimationController(this),
            parallax: new ParallaxController(this),
            project: new ProjectController(this)
        };
    }

    startApplication() {
        Object.values(this.controllers).forEach(controller => controller.init());
        this.controllers.animation.start();
    }
}

// Controller classes
class MusicController {
    constructor(app) {
        this.app = app;
    }

    init() {
        this.app.elements.musicControl.addEventListener('click', () => this.toggleMusic());
    }

    toggleMusic() {
        this.app.state.isPlaying = !this.app.state.isPlaying;
        const { audio, playIcon, musicControl } = this.app.elements;
        const visualizer = musicControl.querySelector('.visualizer');
        
        if (this.app.state.isPlaying) {
            audio.play();
            playIcon.classList.add('hidden');
            visualizer.classList.remove('hidden');
            musicControl.classList.add('playing');
        } else {
            audio.pause();
            playIcon.classList.remove('hidden');
            visualizer.classList.add('hidden');
            musicControl.classList.remove('playing');
        }
    }
}

class AnimationController {
    constructor(app) {
        this.app = app;
    }

    init() {}

    start() {
        if (this.app.state.animationInterval) {
            clearInterval(this.app.state.animationInterval);
        }
        this.playRandomAnimation();
        this.app.state.animationInterval = setInterval(
            () => this.playRandomAnimation(),
            this.getRandomInterval()
        );
    }

    getRandomInterval() {
        const { min, max } = CONFIG.animation.interval;
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    playRandomAnimation() {
        if (!this.app.state.isProjectOpen) {
            const animation = this.getRandomAnimation();
            this.app.elements.projectCards.forEach(card => {
                card.classList.remove(...CONFIG.animation.types);
                card.classList.add(animation);
                setTimeout(() => card.classList.remove(animation), CONFIG.animation.duration);
            });
        }
    }

    getRandomAnimation() {
        const { types } = CONFIG.animation;
        return types[Math.floor(Math.random() * types.length)];
    }
}

class ParallaxController {
    constructor(app) {
        this.app = app;
        this.ticking = false;
    }

    init() {
        document.addEventListener('mousemove', e => this.handleMouseMove(e), { passive: true });
        document.addEventListener('mouseleave', () => this.resetTransform());
    }

    handleMouseMove(e) {
        if (!this.ticking && !this.app.state.isProjectOpen) {
            requestAnimationFrame(() => {
                this.updateTransform(e);
                this.ticking = false;
            });
            this.ticking = true;
        }
    }

    updateTransform(e) {
        const { strength, rotation } = CONFIG.parallax;
        const { moveX, moveY } = this.calculateMovement(e);
        
        this.app.elements.mainContent.style.transform = `
            translate3d(${moveX * strength}px, ${moveY * strength}px, 0)
            rotateY(${moveX * rotation}deg)
            rotateX(${-moveY * rotation}deg)
        `;
    }

    calculateMovement(e) {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        return {
            moveX: (e.clientX - centerX) / centerX,
            moveY: (e.clientY - centerY) / centerY
        };
    }

    resetTransform() {
        if (!this.app.state.isProjectOpen) {
            this.app.elements.mainContent.style.transform = 'translate3d(0, 0, 0) rotateX(0) rotateY(0)';
        }
    }
}

class ProjectController {
    constructor(app) {
        this.app = app;
    }

    init() {
        this.app.elements.projectRectangles.forEach(rectangle => {
            rectangle.addEventListener('click', e => this.handleClick(rectangle, e));
        });
        this.app.elements.overlay.addEventListener('click', () => this.close());
    }

    handleClick(rectangle, e) {
        if (!this.app.state.isProjectOpen) {
            this.open(rectangle, e);
        }
    }

    open(rectangle, e) {
        e.stopPropagation();
        this.app.state.isProjectOpen = true;
        
        clearInterval(this.app.state.animationInterval);
        this.app.elements.mainContent.style.transform = 'none';
        this.app.elements.projectCards.forEach(card => {
            card.classList.remove(...CONFIG.animation.types);
        });
        
        const position = rectangle.id === 'rectangleL' ? 'left' : 'right';
        rectangle.classList.add('opened', position);
        this.app.elements.overlay.classList.add('active');
    }

    close() {
        const openedRectangle = document.querySelector(CONFIG.selectors.openedRectangle);
        if (openedRectangle) {
            this.app.state.isProjectOpen = false;
            this.app.elements.overlay.classList.remove('active');
            openedRectangle.classList.remove('opened', 'left', 'right');
            this.app.controllers.animation.start();
        }
    }
}

// Initialize application
document.addEventListener('DOMContentLoaded', () => {
    const app = new App();
    app.init();
});


