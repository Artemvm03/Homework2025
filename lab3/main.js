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
        this.reticle = null;
        this.hitTestSource = null;
        this.hitTestSourceRequested = false;
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

        if ('xr' in navigator) {
            try {
                const isSupported = await navigator.xr.isSessionSupported('immersive-ar');
                if (!isSupported) {
                    arButton.style.display = 'none';
                    errorDiv.classList.remove('hidden');
                }
            } catch (error) {
                console.warn('AR підтримка не визначена:', error);
                // Залишаємо кнопку для тестування
            }
        } else {
            console.warn('WebXR не підтримується');
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

        // Створення рендерера з налаштуваннями для AR
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 0); // Повністю прозорий фон для AR
        this.renderer.xr.enabled = true;
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        document.getElementById('container').appendChild(this.renderer.domElement);

        // Додавання освітлення для AR
        this.setupLighting();

        // Створення атома літію
        this.createLithiumAtom();

        // Створення прицілу для розміщення
        this.createReticle();

        // Налаштування AR режиму
        this.setupARMode();
    }

    setupLighting() {
        // Освітлення, що працює з реальним світом
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambientLight);

        // Направлене освітлення
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(1, 1, 1);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(directionalLight);

        // Додаткове освітлення для кращої видимості
        const hemisphereLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.3);
        this.scene.add(hemisphereLight);
    }

    createLithiumAtom() {
        this.atomGroup = new THREE.Group();

        // Створення ядра
        this.createNucleus();

        // Створення електронів
        this.createElectrons();

        // Початкове приховання атома до розміщення
        this.atomGroup.visible = false;
        this.scene.add(this.atomGroup);
    }

    createNucleus() {
        // Ядро літію
        const nucleusGeometry = new THREE.SphereGeometry(0.05, 16, 16);
        const nucleusMaterial = new THREE.MeshStandardMaterial({
            color: 0xffdd44,
            metalness: 0.3,
            roughness: 0.4,
            emissive: 0x222200
        });

        this.nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
        this.nucleus.castShadow = true;
        
        // Додаємо протони (червоні сфери)
        for (let i = 0; i < 3; i++) {
            const protonGeometry = new THREE.SphereGeometry(0.012, 8, 8);
            const protonMaterial = new THREE.MeshStandardMaterial({ 
                color: 0xff3333,
                emissive: 0x330000
            });
            const proton = new THREE.Mesh(protonGeometry, protonMaterial);
            
            const angle = (i / 3) * Math.PI * 2;
            proton.position.set(
                Math.cos(angle) * 0.025,
                Math.sin(angle) * 0.025,
                (i % 2) * 0.015 - 0.007
            );
            
            this.nucleus.add(proton);
        }

        // Додаємо нейтрони (сині сфери)
        for (let i = 0; i < 4; i++) {
            const neutronGeometry = new THREE.SphereGeometry(0.012, 8, 8);
            const neutronMaterial = new THREE.MeshStandardMaterial({ 
                color: 0x3366ff,
                emissive: 0x000033
            });
            const neutron = new THREE.Mesh(neutronGeometry, neutronMaterial);
            
            const angle = (i / 4) * Math.PI * 2 + Math.PI / 4;
            neutron.position.set(
                Math.cos(angle) * 0.02,
                Math.sin(angle) * 0.02,
                (i % 2) * 0.012 - 0.006
            );
            
            this.nucleus.add(neutron);
        }

        this.atomGroup.add(this.nucleus);
    }

    createElectrons() {
        // Створюємо 3 електрони для літію
        const electronGeometry = new THREE.SphereGeometry(0.008, 8, 8);
        const electronMaterial = new THREE.MeshStandardMaterial({
            color: 0x00ffff,
            metalness: 0.8,
            roughness: 0.1,
            emissive: 0x003333
        });

        // K-оболонка: 2 електрони
        for (let i = 0; i < 2; i++) {
            const electron = new THREE.Mesh(electronGeometry, electronMaterial);
            electron.userData = { 
                orbitRadius: 0.12,
                orbitSpeed: 3,
                orbitOffset: i * Math.PI,
                orbitTilt: 0,
                shell: 'K'
            };
            this.electrons.push(electron);
            this.atomGroup.add(electron);
        }

        // L-оболонка: 1 електрон
        const electron3 = new THREE.Mesh(electronGeometry, electronMaterial);
        electron3.userData = { 
            orbitRadius: 0.2,
            orbitSpeed: 2,
            orbitOffset: 0,
            orbitTilt: Math.PI / 4,
            shell: 'L'
        };
        this.electrons.push(electron3);
        this.atomGroup.add(electron3);

        // Створення орбітальних траєкторій (візуальні кільця)
        this.createOrbits();
    }

    createOrbits() {
        // K-орбіта
        const kOrbitGeometry = new THREE.RingGeometry(0.115, 0.125, 32);
        const kOrbitMaterial = new THREE.MeshBasicMaterial({
            color: 0x666666,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        const kOrbit = new THREE.Mesh(kOrbitGeometry, kOrbitMaterial);
        kOrbit.rotation.x = Math.PI / 2;
        this.atomGroup.add(kOrbit);

        // L-орбіта
        const lOrbitGeometry = new THREE.RingGeometry(0.195, 0.205, 32);
        const lOrbitMaterial = new THREE.MeshBasicMaterial({
            color: 0x666666,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        const lOrbit = new THREE.Mesh(lOrbitGeometry, lOrbitMaterial);
        lOrbit.rotation.x = Math.PI / 2 + Math.PI / 4;
        this.atomGroup.add(lOrbit);
    }

    createReticle() {
        // Прицільна сітка для розміщення атома
        const reticleGeometry = new THREE.RingGeometry(0.03, 0.035, 16);
        const reticleMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.8
        });
        
        this.reticle = new THREE.Mesh(reticleGeometry, reticleMaterial);
        this.reticle.matrixAutoUpdate = false;
        this.reticle.visible = false;
        this.scene.add(this.reticle);
    }

    setupARMode() {
        // Налаштування контролерів для AR
        const controller = this.renderer.xr.getController(0);
        controller.addEventListener('select', () => this.onSelect());
        this.scene.add(controller);

        window.addEventListener('resize', () => this.onWindowResize());
    }

    onSelect() {
        // Розміщення атома при дотику/кліку
        if (this.reticle.visible && !this.atomPlaced) {
            // Копіюємо позицію та орієнтацію прицілу
            this.atomGroup.position.setFromMatrixPosition(this.reticle.matrix);
            this.atomGroup.quaternion.setFromRotationMatrix(this.reticle.matrix);
            
            // Підняти трохи над поверхнею
            this.atomGroup.position.y += 0.1;
            
            // Показати атом та приховати приціл
            this.atomGroup.visible = true;
            this.reticle.visible = false;
            this.atomPlaced = true;
            
            // Показати інструкції
            document.getElementById('controls').classList.remove('hidden');
        }
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
                // Запуск AR сесії з hit-testing
                const session = await navigator.xr.requestSession('immersive-ar', {
                    requiredFeatures: ['local'],
                    optionalFeatures: ['hit-test']
                });

                await this.renderer.xr.setSession(session);
                this.isARActive = true;
                
                // Запуск анімації
                this.renderer.setAnimationLoop((timestamp, frame) => this.animate(timestamp, frame));
                
                loadingDiv.classList.add('hidden');
                
                session.addEventListener('end', () => {
                    this.endAR();
                });

            } else {
                throw new Error('WebXR не підтримується');
            }

        } catch (error) {
            console.error('Помилка запуску AR:', error);
            loadingDiv.classList.add('hidden');
            errorDiv.classList.remove('hidden');
            
            // Автоматично приховати помилку та показати кнопку
            setTimeout(() => {
                errorDiv.classList.add('hidden');
                arButton.classList.remove('hidden');
            }, 5000);
        }
    }

    animate(timestamp, frame) {
        if (!this.scene) return;

        const elapsedTime = timestamp * 0.001;

        // Hit testing для розміщення атома
        if (frame && !this.atomPlaced) {
            const referenceSpace = this.renderer.xr.getReferenceSpace();
            const session = this.renderer.xr.getSession();

            if (this.hitTestSourceRequested === false) {
                session.requestReferenceSpace('viewer').then((referenceSpace) => {
                    session.requestHitTestSource({ space: referenceSpace }).then((source) => {
                        this.hitTestSource = source;
                    });
                });
                this.hitTestSourceRequested = true;
            }

            if (this.hitTestSource) {
                const hitTestResults = frame.getHitTestResults(this.hitTestSource);
                if (hitTestResults.length) {
                    const hit = hitTestResults[0];
                    this.reticle.visible = true;
                    this.reticle.matrix.fromArray(hit.getPose(referenceSpace).transform.matrix);
                } else {
                    this.reticle.visible = false;
                }
            }
        }

        // Анімація атома, якщо він розміщений
        if (this.atomPlaced && this.atomGroup.visible) {
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
        }

        this.renderer.render(this.scene, this.camera);
    }

    endAR() {
        this.isARActive = false;
        this.atomPlaced = false;
        
        const arButton = document.getElementById('ar-button');
        const controlsDiv = document.getElementById('controls');
        
        arButton.classList.remove('hidden');
        controlsDiv.classList.add('hidden');
        
        // Очистка hit test
        if (this.hitTestSource) {
            this.hitTestSource.cancel();
            this.hitTestSource = null;
        }
        this.hitTestSourceRequested = false;
        
        // Приховати атом та показати приціл
        if (this.atomGroup) this.atomGroup.visible = false;
        if (this.reticle) this.reticle.visible = false;
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
