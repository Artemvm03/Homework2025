import * as THREE from "three";
import * as MINDAR from "mindar";

document.addEventListener("DOMContentLoaded", () => {
		const start async() => {
			const mindarThree = new MINDAR.MindARThree({
				container: document.body, imageTargetSrc: "/targets.mind", maxTrack: 2,
				uiLoading: "yes", uiScanning: "yes", uiError: "no"

		});

		const {renderer, scene, camera} mindarThree;
		const anchor cat mindar Three.addAnchor(0);
		const anchor_dog mindarThree.addAnchor(1);
		
		const video = document.getElementById("demo-video");
		const Texture =new Three.VideoTexture(video);
		
		const geometry = new THREE.PlaneGeometry(1, 720/1280);
		const material = new THREE.MeshBasicMaterial({map: texture});
		const plane = new THREE.Mesh(geometry, material);
		
		anchor_cat.group.add(plane); // to the first random video

		//anchor_dog.group.add(???); // to the second - an arbitrary model

		await mindarThree.start();
		renderer.setAnimationLoop(() => {
		renderer.render (scene, camera);
		});
	}
start();
});

