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
        this.hitTestSource = null;
        this.hitTestSourceRequested = false;
        this.reticle = null;
        this.atomPlaced = false;
        
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
        const errorMessage = document.getElementById('error-message');

        if ('xr' in navigator) {
            try {
                const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
                if (!isSupported) {
                    arButton.textContent = '📱 Демо режим';
                    errorMessage.textContent = 'AR не підтримується. Буде запущено демо режим.';
                }
            } catch (error) {
                console.warn('AR підтримка не визначена:', error);
                arButton.textContent = '📱 Демо режим';
                errorMessage.textContent = 'AR не підтримується. Буде запущено демо режим.';
            }
        } else {
            arButton.textContent = '📱 Демо режим';
            errorMessage.textContent = 'WebXR не підтримується. Буде запущено демо режим.';
        }
    }

    setupThreeJS() {
        // Створення сцени
        this.scene = new THREE.Scene();

        // Налаштування камери для AR
        this.camera = new THREE.PerspectiveCamera(
            70,
            window.innerWidth / window.innerHeight,
            0.01,
            20
        );

        // Створення рендерера з підтримкою AR
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.xr.enabled = true;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        document.getElementById('container').appendChild(this.renderer.domElement);

        // Додавання освітлення для AR
        this.setupARLighting();

        // Створення атома літію
        this.createLithiumAtom();

        // Створення реticle для AR
        this.createReticle();
    }

    setupARLighting() {
        // Амбієнтне освітлення для AR - менше, щоб зберегти реальність
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        // Направлене освітлення
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(directionalLight);
    }

    createReticle() {
        const geometry = new THREE.RingGeometry(0.15, 0.2, 32).rotateX(-Math.PI / 2);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff6b6b,
            transparent: true,
            opacity: 0.5
        });
        this.reticle = new THREE.Mesh(geometry, material);
        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.scene.add(this.reticle);
    }

    createLithiumAtom() {
        this.atomGroup = new THREE.Group();

        // Створення ядра (3 протони + 4 нейтрони)
        this.createNucleus();

        // Створення електронів
        this.createElectrons();

        // Початкове позиціонування (буде змінено в AR)
        this.atomGroup.position.set(0, 0, -1);
        this.atomGroup.scale.set(0.3, 0.3, 0.3); // Зменшуємо для AR
        
        // Спочатку прихований, поки не буде розміщений в AR
        this.atomGroup.visible = false;
        
        this.scene.add(this.atomGroup);
    }

    createNucleus() {
        // Ядро літію
        const nucleusGeometry = new THREE.SphereGeometry(0.4, 32, 32);
        const nucleusMaterial = new THREE.MeshPhongMaterial({
            color: 0x888888,
            shininess: 100,
            transparent: true,
            opacity: 0.3
        });

        this.nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
        
        // Додаємо протони (червоні сфери)
        for (let i = 0; i < 3; i++) {
            const protonGeometry = new THREE.SphereGeometry(0.12, 16, 16);
            const protonMaterial = new THREE.MeshPhongMaterial({ 
                color: 0xff3333,
                shininess: 80
            });
            const proton = new THREE.Mesh(protonGeometry, protonMaterial);
            
            const angle = (i / 3) * Math.PI * 2;
            proton.position.set(
                Math.cos(angle) * 0.2,
                Math.sin(angle) * 0.2,
                (i % 2) * 0.15 - 0.075
            );
            
            this.nucleus.add(proton);
        }

        // Додаємо нейтрони (сині сфери)
        for (let i = 0; i < 4; i++) {
            const neutronGeometry = new THREE.SphereGeometry(0.12, 16, 16);
            const neutronMaterial = new THREE.MeshPhongMaterial({ 
                color: 0x3366ff,
                shininess: 80
            });
            const neutron = new THREE.Mesh(neutronGeometry, neutronMaterial);
            
            const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
            neutron.position.set(
                Math.cos(angle) * 0.18,
                Math.sin(angle) * 0.18,
                (i % 2) * 0.12 - 0.06
            );
            
            this.nucleus.add(neutron);
        }

        this.atomGroup.add(this.nucleus);
    }

    createElectrons() {
        const electronGeometry = new THREE.SphereGeometry(0.08, 16, 16);
        const electronMaterial = new THREE.MeshPhongMaterial({
            color: 0x00ff00,
            shininess: 100,
            emissive: 0x002200
        });

        // Перша орбіта (K-оболонка): 2 електрони
        for (let i = 0; i < 2; i++) {
            const electron = new THREE.Mesh(electronGeometry, electronMaterial);
            electron.userData = { 
                orbitRadius: 1.0,
                orbitSpeed: 3,
                orbitOffset: i * Math.PI,
                orbitTilt: 0,
                shell: 'K'
            };
            this.electrons.push(electron);
            this.atomGroup.add(electron);
        }

        // Друга орбіта (L-оболонка): 1 електрон
        const electron3 = new THREE.Mesh(electronGeometry, electronMaterial);
        electron3.userData = { 
            orbitRadius: 1.6,
            orbitSpeed: 2,
            orbitOffset: 0,
            orbitTilt: Math.PI / 4,
            shell: 'L'
        };
        this.electrons.push(electron3);
        this.atomGroup.add(electron3);

        // Створення орбітальних кілець для візуалізації
        this.createOrbitRings();
    }

    createOrbitRings() {
        // Кільце для K-оболонки
        const ring1Geometry = new THREE.RingGeometry(0.98, 1.02, 64);
        const ring1Material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        const ring1 = new THREE.Mesh(ring1Geometry, ring1Material);
        ring1.rotation.x = Math.PI / 2;
        this.atomGroup.add(ring1);

        // Кільце для L-оболонки
        const ring2Geometry = new THREE.RingGeometry(1.58, 1.62, 64);
        const ring2Material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.15,
            side: THREE.DoubleSide
        });
        const ring2 = new THREE.Mesh(ring2Geometry, ring2Material);
        ring2.rotation.x = Math.PI / 2 + Math.PI / 4;
        this.atomGroup.add(ring2);
    }

    async startAR() {
        const arButton = document.getElementById('ar-button');
        const loadingDiv = document.getElementById('loading');
        const errorDiv = document.getElementById('error');
        const arControls = document.getElementById('ar-controls');

        try {
            arButton.classList.add('hidden');
            loadingDiv.classList.remove('hidden');

            // Ініціалізація Three.js
            this.setupThreeJS();

            if ('xr' in navigator && await navigator.xr.isSessionSupported('immersive-ar')) {
                // Запуск AR сесії
                const session = await navigator.xr.requestSession('immersive-ar', {
                    requiredFeatures: ['local'],
                    optionalFeatures: ['hit-test']
                });

                await this.renderer.xr.setSession(session);
                this.isARActive = true;
                
                // Налаштування hit-test для розміщення об'єктів
                session.requestReferenceSpace('viewer').then((referenceSpace) => {
                    session.requestHitTestSource({ space: referenceSpace }).then((source) => {
                        this.hitTestSource = source;
                    });
                });

                // Обробка кліків/торкань для розміщення атома
                this.renderer.domElement.addEventListener('click', this.onSelect.bind(this));
                this.renderer.domElement.addEventListener('touchend', this.onSelect.bind(this));
                
                // Запуск анімації
                this.renderer.setAnimationLoop((time, frame) => this.animate(time, frame));
                
                loadingDiv.classList.add('hidden');
                arControls.classList.remove('hidden');
                
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
            
            // Запуск демо режиму як fallback
            this.startDemoMode();
        }
    }

    onSelect(event) {
        if (!this.isARActive || this.atomPlaced) return;

        if (this.reticle.visible) {
            // Розміщуємо атом в позиції reticle
            this.atomGroup.position.setFromMatrixPosition(this.reticle.matrix);
            this.atomGroup.visible = true;
            this.atomPlaced = true;
            this.reticle.visible = false;

            // Прибираємо інструкції
            const arControls = document.getElementById('ar-controls');
            arControls.innerHTML = '✅ Атом розміщено! Рухайте камеру для огляду';
        }
    }

    startDemoMode() {
        if (!this.scene) this.setupThreeJS();
        
        // Позиціонування камери для демо режиму
        this.camera.position.set(0, 0, 3);
        this.camera.lookAt(0, 0, 0);
        
        // В демо режимі показуємо атом відразу
        if (this.atomGroup) {
            this.atomGroup.position.set(0, 0, 0);
            this.atomGroup.scale.set(0.5, 0.5, 0.5);
            this.atomGroup.visible = true;
            this.atomPlaced = true;
        }
        
        // Запуск анімації
        this.renderer.setAnimationLoop((time) => this.animate(time));
        
        // Додаємо контроли миші для демо режиму
        this.addMouseControls();

        // Показуємо повідомлення про демо режим
        const arControls = document.getElementById('ar-controls');
        arControls.innerHTML = '🖱️ Демо режим: рухайте мишею для огляду атома';
        arControls.classList.remove('hidden');
    }

    addMouseControls() {
        if (this.isARActive) return;
        
        let mouseX = 0, mouseY = 0;
        let isMouseDown = false;
        
        const handleMouseMove = (event) => {
            if (this.isARActive) return;
            
            const deltaX = event.clientX - mouseX;
            const deltaY = event.clientY - mouseY;
            
            if (isMouseDown && this.atomGroup) {
                this.atomGroup.rotation.y += deltaX * 0.01;
                this.atomGroup.rotation.x += deltaY * 0.01;
            }
            
            mouseX = event.clientX;
            mouseY = event.clientY;
        };

        const handleMouseDown = () => {
            isMouseDown = true;
        };

        const handleMouseUp = () => {
            isMouseDown = false;
        };

        const handleTouchMove = (event) => {
            if (this.isARActive || event.touches.length !== 1) return;
            
            const touch = event.touches[0];
            const deltaX = touch.clientX - mouseX;
            const deltaY = touch.clientY - mouseY;
            
            if (this.atomGroup) {
                this.atomGroup.rotation.y += deltaX * 0.01;
                this.atomGroup.rotation.x += deltaY * 0.01;
            }
            
            mouseX = touch.clientX;
            mouseY = touch.clientY;
        };
        
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mousedown', handleMouseDown);
        document.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('touchmove', handleTouchMove);
    }

    animate(time, frame) {
        if (!this.atomGroup) return;

        const elapsedTime = time * 0.001;

        // Обертання ядра
        if (this.nucleus) {
            this.nucleus.rotation.y = elapsedTime * 0.5;
            this.nucleus.rotation.x = elapsedTime * 0.3;
        }

        // Анімація електронів по орбітах
        this.electrons.forEach((electron) => {
            const userData = electron.userData;
            const angle = elapsedTime * userData.orbitSpeed + userData.orbitOffset;
            
            electron.position.set(
                Math.cos(angle) * userData.orbitRadius,
                Math.sin(angle * 0.7) * userData.orbitRadius * 0.3,
                Math.sin(angle) * userData.orbitRadius * Math.cos(userData.orbitTilt)
            );

            // Власне обертання електронів
            electron.rotation.y = elapsedTime * 8;
        });

        // AR hit-test логіка
        if (this.isARActive && frame && this.hitTestSource && !this.atomPlaced) {
            const referenceSpace = this.renderer.xr.getReferenceSpace();
            const hitTestResults = frame.getHitTestResults(this.hitTestSource);

            if (hitTestResults.length > 0) {
                const hit = hitTestResults[0];
                this.reticle.visible = true;
                this.reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
            } else {
                this.reticle.visible = false;
            }
        }

        // В демо режимі додаємо автообертання
        if (!this.isARActive && this.atomGroup) {
            this.atomGroup.rotation.y += 0.003;
        }

        this.renderer.render(this.scene, this.camera);
    }

    endAR() {
        this.isARActive = false;
        this.atomPlaced = false;
        const arButton = document.getElementById('ar-button');
        const arControls = document.getElementById('ar-controls');
        
        arButton.classList.remove('hidden');
        arControls.classList.add('hidden');
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }

        // Прибираємо рендерер
        if (this.renderer && this.renderer.domElement) {
            document.getElementById('container').removeChild(this.renderer.domElement);
        }
    }

    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Обробка зміни розміру вікна
window.addEventListener('resize', () => {
    if (window.lithiumAtomAR) {
        window.lithiumAtomAR.onWindowResize();
    }
});

// Запуск додатку після завантаження DOM
document.addEventListener('DOMContentLoaded', () => {
    window.lithiumAtomAR = new LithiumAtomAR();
});
