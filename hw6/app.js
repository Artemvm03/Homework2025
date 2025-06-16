window.addEventListener('load', () => {
  const sceneEl = document.querySelector('a-scene');
  const mindarComponent = sceneEl.components['mindar-image'];

  const anchors = {
    a: document.querySelector('#anchor-a'),
    b: document.querySelector('#anchor-b'),
    c: document.querySelector('#anchor-c'),
    d: document.querySelector('#anchor-d'),
  };

  // Об’єкти ліній (a-cylinder), які ми створимо і додамо до сцени для ребер чотирикутника
  const lines = [];

  // Функція створення лінії (циліндр)
  function createLine() {
    const line = document.createElement('a-cylinder');
    line.setAttribute('radius', '0.005');
    line.setAttribute('color', 'red');
    line.setAttribute('visible', false);
    sceneEl.appendChild(line);
    return line;
  }

  // Створюємо 4 лінії для ребер A-B, B-C, C-D, D-A
  lines.push(createLine());
  lines.push(createLine());
  lines.push(createLine());
  lines.push(createLine());

  // Функція отримати світову позицію як THREE.Vector3
  function getWorldPosition(el) {
    return el.object3D.getWorldPosition(new THREE.Vector3());
  }

  // Функція оновлення позиції і орієнтації лінії між двома точками
  function updateLine(line, posA, posB) {
    const distance = posA.distanceTo(posB);
    line.setAttribute('height', distance);

    // Середина між точками
    const midPoint = new THREE.Vector3().addVectors(posA, posB).multiplyScalar(0.5);
    line.object3D.position.copy(midPoint);

    line.object3D.lookAt(posB);
    line.object3D.rotateX(Math.PI / 2);
    line.setAttribute('visible', true);
  }

  // Перевіряємо чи всі 4 маркери активні
  function allMarkersVisible() {
    return Object.values(anchors).every(anchor => anchor.object3D.visible);
  }

  // Обчислення відстані між двома точками (THREE.Vector3)
  function dist(p1, p2) {
    return p1.distanceTo(p2);
  }

  // Обчислення площі трикутника за координатами трьох точок
  function triangleArea(p1, p2, p3) {
    const a = dist(p1, p2);
    const b = dist(p2, p3);
    const c = dist(p3, p1);
    const s = (a + b + c) / 2;
    return Math.sqrt(s * (s - a) * (s - b) * (s - c));
  }

  // Відслідковуємо анімаційний цикл A-Frame
  sceneEl.addEventListener('renderstart', () => {
    sceneEl.renderer.setAnimationLoop(() => {
      if (allMarkersVisible()) {
        const posA = getWorldPosition(anchors.a);
        const posB = getWorldPosition(anchors.b);
        const posC = getWorldPosition(anchors.c);
        const posD = getWorldPosition(anchors.d);

        updateLine(lines[0], posA, posB); // AB
        updateLine(lines[1], posB, posC); // BC
        updateLine(lines[2], posC, posD); // CD
        updateLine(lines[3], posD, posA); // DA

        // Виводимо у консоль периметр і площі
        const perimeter = dist(posA, posB) + dist(posB, posC) + dist(posC, posD) + dist(posD, posA);
        const areas = {
          ABC: triangleArea(posA, posB, posC),
          ABD: triangleArea(posA, posB, posD),
          ACD: triangleArea(posA, posC, posD),
          BCD: triangleArea(posB, posC, posD),
        };

        console.clear();
        console.log(`Периметр чотирикутника: ${perimeter.toFixed(4)}`);
        console.log('Площі трикутників:');
        for (const [name, area] of Object.entries(areas)) {
          console.log(`  ${name}: ${area.toFixed(4)}`);
        }
      } else {
        // Якщо хоч один маркер не видимий — ховаємо лінії
        lines.forEach(line => line.setAttribute('visible', false));
      }
    });
  });
});