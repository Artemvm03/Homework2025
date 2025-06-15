import * as THREE from 'three';

document.addEventListener("DOMContentLoaded", () => {
  const scene = new THREE.Scene();

const geometry = new THREE.TorusGeometry(
    1,     
    0.4,   
    16,    
    100    
  );
  const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // червоний тор
  const torus = new THREE.Mesh(geometry, material);

  scene.add(torus);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 100;

  const renderer = new THREE.WebGLRenderer({ alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  function animate() {
    requestAnimationFrame(animate);
    torus.rotation.x += 0.01;
    torus.rotation.y += 0.01;
    renderer.render(scene, camera);
  }

  animate();
});