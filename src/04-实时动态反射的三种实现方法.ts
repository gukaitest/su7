import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { RGBELoader } from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

renderer.setAnimationLoop(animationLoop);

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

// const boxGeo = new THREE.BoxGeometry(1, 1, 1);
// const boxMat = new THREE.MeshBasicMaterial({color: 0x00ff00});
// const boxMesh = new THREE.Mesh(boxGeo, boxMat);
// scene.add(boxMesh);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 100);
camera.position.set(0, 1, 5);

const controls = new OrbitControls(camera, renderer.domElement);

const gltfLoader = new GLTFLoader();
gltfLoader.load('car.glb', (gltf)=>{
    scene.add(gltf.scene);

    // gltf.scene.traverse((child)=>{
    //     if(child.name === 'ground') {
    //         // @ts-ignore
    //         child.material.side = THREE.DoubleSide;
    //     }
    // });
});

const rgbeLoader = new RGBELoader();
rgbeLoader.load('sky.hdr',(skyTexture)=>{
    scene.background = skyTexture;
    scene.environment = skyTexture;
    skyTexture.mapping = THREE.EquirectangularReflectionMapping;
});

function animationLoop() {
    renderer.render(scene, camera);
    controls.update();
}
