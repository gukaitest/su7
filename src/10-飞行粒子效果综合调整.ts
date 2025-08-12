import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { RGBELoader } from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

let ground: any;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

renderer.setAnimationLoop(animationLoop);

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();

// 1.创建WebgGLCubeRenderTarget。
const cubeRenderTarget = new THREE.WebGLCubeRenderTarget(1024);
// 2.将第1步创建的WebgGLCubeRenderTarget对象作为参数传递给CubeCamera。
const cubeCamera = new THREE.CubeCamera(0.1, 500, cubeRenderTarget);
// 3.在帧循环中调用第2步中创建的CubeCamera对象的update方法，每帧更新渲染结果。
// 4.将WebgGLCubeRenderTarget对象的texture赋值给环境材质的环境贴图通道：envMap。

// const boxGeo = new THREE.BoxGeometry(1, 1, 1);
// const boxMat = new THREE.MeshBasicMaterial({color: 0x00ff00});
// const boxMesh = new THREE.Mesh(boxGeo, boxMat);
// scene.add(boxMesh);
// boxMesh.position.set(0, 1.2, 0);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 500);
camera.position.set(0, 1, 5);

const controls = new OrbitControls(camera, renderer.domElement);

const gltfLoader = new GLTFLoader();
gltfLoader.load('car.glb', (gltf)=>{
    scene.add(gltf.scene);

    gltf.scene.traverse((child: any)=>{

        if (child.type === 'Mesh') {
            child.material.envMap = cubeRenderTarget.texture;

            // child.visible = false;
        }

        if (child.name === 'ground') {
            // @ts-ignore
            child.material.side = THREE.FrontSide;

            child.visible = true;

            ground = child;
        }

        if (child.name === 'flyLight') {
            child.material.map.anisotropy = 8;
        }
    });
});

const rgbeLoader = new RGBELoader();
rgbeLoader.load('sky.hdr',(skyTexture)=>{
    scene.background = skyTexture;
    scene.environment = skyTexture;
    skyTexture.mapping = THREE.EquirectangularReflectionMapping;
});

function animationLoop() {
    controls.update();

    if (ground) {
        ground.visible = false;
        cubeCamera.position.copy(camera.position);
        cubeCamera.position.y = -cubeCamera.position.y;
        cubeCamera.update(renderer, scene);
        ground.visible = true;
    }

    renderer.render(scene, camera);
}
