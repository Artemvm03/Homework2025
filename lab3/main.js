// WebAR Атом Літію - main.js
class LithiumAtomAR {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.atomGroup = null;
        this.nucleus = null;
        this.electrons = [];
        this.isARActive = false;
        this.animationId = null;
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkARSupport();
    }

    setupEventListeners() {
        const arButton = document.getElementById('ar-button');
        arButton.addEventListener('click', () => this.startAR());
    }

    async checkARSupport() {
        const arButton = document.getElementById('ar-button');
        const errorDiv = document.getElementById('error');

        if ('xr' in navigator) {
            try {
                const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
                if (!isSupported) {
                    arButton.style.display = 'none';
                    errorDiv.classList.remove('hidden');
                }
            } catch (error) {
                console.warn('AR підтримка не визначена:', error);
                arButton.textContent = '📱 Демо режим';
            }
        } else {
            arButton.textContent = '📱 Демо режим';
        }
    }

    setupThreeJS() {
        // Створення сцени
        this.scene = new THREE.Scene();

        // Налаштування камери
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );

        // Створення рендерера
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000000, 0); // Прозорий фон
        this.renderer.xr.enabled = true;
        document.getElementById('container').appendChild(this.renderer.domElement);

        // Завантаження текстур
        this.textureLoader = new THREE.TextureLoader();
        this.nucleusTexture = this.textureLoader.load('https://raw.githubusercontent.com/aframevr/sample-assets/master/assets/images/noise/waternormals.jpg');
        this.electronTexture = this.textureLoader.load('https://raw.githubusercontent.com/aframevr/sample-assets/master/assets/images/noise/water.jpg');

        // Додавання освітлення
        this.setupLighting();

        // Створення атома літію
        this.createLithiumAtom();

        // Налаштування AR режиму
        this.setupARMode();
    }

    setupLighting() {
        // Амбієнтне освітлення
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Направлене освітлення
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // Точкове освітлення для ефекту
        const pointLight = new THREE.PointLight(0x00ff88, 0.8, 100);
        pointLight.position.set(0, 0, 5);
        this.scene.add(pointLight);
    }

    createLithiumAtom() {
        this.atomGroup = new THREE.Group();

        // Створення ядра (3 протони + 4 нейтрони)
        this.createNucleus();

        // Створення електронів (2 електрони для літію)
        this.createElectrons();

        // Позиціонування атома
        this.atomGroup.position.set(0, 0, -2);
        this.scene.add(this.atomGroup);
    }

    createNucleus() {
        // Ядро літію з текстурою
        const nucleusGeometry = new THREE.SphereGeometry(0.3, 32, 32);
        const nucleusMaterial = new THREE.MeshStandardMaterial({
            map: this.nucleusTexture,
            metalness: 0.6,
            roughness: 0.4
        });

        this.nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
        
        // Додаємо протони (червоні сфери)
        for (let i = 0; i < 3; i++) {
            const protonGeometry = new THREE.SphereGeometry(0.08, 16, 16);
            const protonMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000 });
            const proton = new THREE.Mesh(protonGeometry, protonMaterial);
            
            const angle = (i / 3) * Math.PI * 2;
            proton.position.set(
                Math.cos(angle) * 0.15,
                Math.sin(angle) * 0.15,
                (i % 2) * 0.1 - 0.05
            );
            
            this.nucleus.add(proton);
        }

        // Додаємо нейтрони (сині сфери)
        for (let i = 0; i < 4; i++) {
            const neutronGeometry = new THREE.SphereGeometry(0.08, 16, 16);
            const neutronMaterial = new THREE.MeshPhongMaterial({ color: 0x0088ff });
            const neutron = new THREE.Mesh(neutronGeometry, neutronMaterial);
            
            const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
            neutron.position.set(
                Math.cos(angle) * 0.12,
                Math.sin(angle) * 0.12,
                (i % 2) * 0.08 - 0.04
            );
            
            this.nucleus.add(neutron);
        }

        this.atomGroup.add(this.nucleus);
    }

    createElectrons() {
        // Створюємо 3 електрони для літію з правильною конфігурацією
        const electronGeometry = new THREE.SphereGeometry(0.05, 16, 16);
        const electronMaterial = new THREE.MeshStandardMaterial({
            map: this.electronTexture,
            metalness: 0.7,
            roughness: 0.2
        });

        // Перша орбіта (K-оболонка): 2 електрони
        const electron1 = new THREE.Mesh(electronGeometry, electronMaterial);
        electron1.userData = { 
            orbitRadius: 0.8,
            orbitSpeed: 2,
            orbitOffset: 0,
            orbitTilt: 0
        };
        this.electrons.push(electron1);
        this.atomGroup.add(electron1);

        const electron2 = new THREE.Mesh(electronGeometry, electronMaterial);
        electron2.userData = { 
            orbitRadius: 0.8,
            orbitSpeed: 2,
            orbitOffset: Math.PI, // протилежна сторона орбіти
            orbitTilt: 0
        };
        this.electrons.push(electron2);
        this.atomGroup.add(electron2);

        // Друга орбіта (L-оболонка): 1 електрон
        const electron3 = new THREE.Mesh(electronGeometry, electronMaterial);
        electron3.userData = { 
            orbitRadius: 1.4,
            orbitSpeed: 1.2,
            orbitOffset: 0,
            orbitTilt: Math.PI / 6
        };
        this.electrons.push(electron3);
        this.atomGroup.add(electron3);
    }

    setupARMode() {
        // Налаштування контролерів для AR
        const controller = this.renderer.xr.getController(0);
        this.scene.add(controller);

        // Додаємо можливість масштабування жестами
        window.addEventListener('resize', () => this.onWindowResize());
    }

    async startAR() {
        const arButton = document.getElementById('ar-button');
        const loadingDiv = document.getElementById('loading');
        const errorDiv = document.getElementById('error');

        try {
            arButton.classList.add('hidden');
            loadingDiv.classList.remove('hidden');

            // Ініціалізація Three.js
            this.setupThreeJS();

            if ('xr' in navigator) {
                // Спроба запуску AR сесії
                const session = await navigator.xr.requestSession('immersive-ar', {
                    requiredFeatures: ['local']
                });

                await this.renderer.xr.setSession(session);
                this.isARActive = true;
                
                // Запуск анімації
                this.renderer.setAnimationLoop((time) => this.animate(time));
                
                loadingDiv.classList.add('hidden');
                
                session.addEventListener('end', () => {
                    this.endAR();
                });

            } else {
                // Демо режим без AR
                this.startDemoMode();
                loadingDiv.classList.add('hidden');
            }

        } catch (error) {
            console.error('Помилка запуску AR:', error);
            loadingDiv.classList.add('hidden');
            errorDiv.classList.remove('hidden');
            
            // Запуск демо режиму як fallback
            setTimeout(() => {
                errorDiv.classList.add('hidden');
                this.startDemoMode();
            }, 3000);
        }
    }

    startDemoMode() {
        if (!this.scene) this.setupThreeJS();
        
        // Позиціонування камери для демо режиму
        this.camera.position.set(0, 0, 3);
        this.camera.lookAt(0, 0, 0);
        
        // Запуск анімації
        this.renderer.setAnimationLoop((time) => this.animate(time));
        
        // Додаємо контроли миші для демо режиму
        this.addMouseControls();
    }

    addMouseControls() {
        let mouseX = 0, mouseY = 0;
        
        document.addEventListener('mousemove', (event) => {
            mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
            
            if (this.atomGroup) {
                this.atomGroup.rotation.y = mouseX * 0.5;
                this.atomGroup.rotation.x = mouseY * 0.3;
            }
        });

        // Тач контроли для мобільних пристроїв
        document.addEventListener('touchmove', (event) => {
            if (event.touches.length === 1) {
                const touch = event.touches[0];
                mouseX = (touch.clientX / window.innerWidth) * 2 - 1;
                mouseY = -(touch.clientY / window.innerHeight) * 2 + 1;
                
                if (this.atomGroup) {
                    this.atomGroup.rotation.y = mouseX * 0.5;
                    this.atomGroup.rotation.x = mouseY * 0.3;
                }
            }
        });
    }

    animate(time) {
        if (!this.atomGroup) return;

        const elapsedTime = time * 0.001; // Convert to seconds

        // Обертання ядра
        if (this.nucleus) {
            this.nucleus.rotation.y = elapsedTime * 0.5;
            this.nucleus.rotation.x = elapsedTime * 0.3;
        }

        // Анімація електронів по орбітах
        this.electrons.forEach((electron, index) => {
            const userData = electron.userData;
            const angle = elapsedTime * userData.orbitSpeed + userData.orbitOffset;
            
            electron.position.set(
                Math.cos(angle) * userData.orbitRadius,
                Math.sin(angle * 0.7) * userData.orbitRadius * 0.3,
                Math.sin(angle) * userData.orbitRadius * Math.cos(userData.orbitTilt)
            );

            // Власне обертання електронів
            electron.rotation.y = elapsedTime * 5;
        });

        // Плавне обертання всього атома
        if (!this.isARActive) {
            this.atomGroup.rotation.y += 0.005;
        }

        this.renderer.render(this.scene, this.camera);
    }

    endAR() {
        this.isARActive = false;
        const arButton = document.getElementById('ar-button');
        arButton.classList.remove('hidden');
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Запуск додатку після завантаження DOM
document.addEventListener('DOMContentLoaded', () => {
    new LithiumAtomAR();
});
