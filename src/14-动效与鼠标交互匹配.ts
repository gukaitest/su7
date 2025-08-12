import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { RGBELoader } from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three/examples/jsm/Addons.js';
import gsap from 'gsap';

const nameToMeshDic: any = {};
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
const cubeCamera = new THREE.CubeCamera(0.1, 600, cubeRenderTarget);
// 3.在帧循环中调用第2步中创建的CubeCamera对象的update方法，每帧更新渲染结果。
// 4.将WebgGLCubeRenderTarget对象的texture赋值给环境材质的环境贴图通道：envMap。

// const boxGeo = new THREE.BoxGeometry(1, 1, 1);
// const boxMat = new THREE.MeshBasicMaterial({color: 0x00ff00});
// const boxMesh = new THREE.Mesh(boxGeo, boxMat);
// scene.add(boxMesh);
// boxMesh.position.set(0, 1.2, 0);

const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 600);
camera.position.set(0, 1, 5);

const controls = new OrbitControls(camera, renderer.domElement);

const gltfLoader = new GLTFLoader();
gltfLoader.load('car.glb', (gltf)=>{
    scene.add(gltf.scene);

    gltf.scene.traverse((child: any)=>{

        nameToMeshDic[child.name] = child;

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

        if (child.name === 'mainCar') {
            child.traverse((item: any)=>{
                if (item.type === 'Mesh') {
                    item.material.envMapIntensity = 5;
                }
            });
        }

        if (child.name === 'flyLight') {
            child.material.map.anisotropy = 8;
            child.material.opacity = 0;
        }
    });
});

const rgbeLoader = new RGBELoader();
rgbeLoader.load('sky.hdr',(skyTexture)=>{
    scene.background = skyTexture;
    scene.environment = skyTexture;
    skyTexture.mapping = THREE.EquirectangularReflectionMapping;
});

window.addEventListener('mousedown', (e)=>{
    console.log(e);
    if (e.button === 0) {
        gsap.to(camera, {
            fov: 80,
            duration: 0.5,
            repeat: 0,
            ease: 'power1.inOut',
            onUpdate: ()=>{
                camera.updateProjectionMatrix();
            }
        });


        const flyLight = nameToMeshDic['flyLight'];
        const flyLightTween = gsap.to(flyLight.material.map.offset, {
            x: flyLight.material.map.offset.x + 1,
            repeat: -1,
            ease: 'none',
            duration: 0.5
        });
        flyLight.userData['flyLightTween'] = flyLightTween;

        const flyLightOpacityTween = gsap.to(flyLight.material, {
            opacity: 1,
            repeat: 0,
            ease: 'none',
            duration: 0.5
        });
        flyLight.userData['flyLightOpacityTween'] = flyLightOpacityTween;

        const wheelFront = nameToMeshDic['wheelFront'];
        const wheelFrontTween = gsap.to(wheelFront.rotation, {
            y: wheelFront.rotation.y + 2 * Math.PI,
            duration: 0.3,
            ease: 'none',
            repeat: -1
        });
        wheelFront.userData['tween'] = wheelFrontTween;

        const wheelBack = nameToMeshDic['wheelBack'];
        const wheelbackTween = gsap.to(wheelBack.rotation, {
            y: wheelBack.rotation.y + 2 * Math.PI,
            duration: 0.3,
            ease: 'none',
            repeat: -1
        });
        wheelBack.userData['tween'] = wheelbackTween;

        const groundDetail = nameToMeshDic['groundDetail'];
        const groundDetailTween = gsap.to(groundDetail.material.map.offset, {
            x: groundDetail.material.map.offset.x + 10,
            repeat: -1,
            duration: 10,
            ease: 'none'
        });
        groundDetail.userData['tween'] = groundDetailTween;
    }
});

window.addEventListener('mouseup', (e)=>{
    console.log(e);
    if (e.button === 0) {
        gsap.to(camera, {
            fov: 60,
            duration: 0.5,
            repeat: 0,
            ease: 'power1.inOut',
            onUpdate: ()=>{
                camera.updateProjectionMatrix();
            }
        });

        nameToMeshDic['flyLight'].userData['flyLightTween'].kill();
        nameToMeshDic['flyLight'].userData['flyLightOpacityTween'].kill();
        nameToMeshDic['wheelFront'].userData['tween'].kill();
        nameToMeshDic['wheelBack'].userData['tween'].kill();
        nameToMeshDic['groundDetail'].userData['tween'].kill();

        const flyLight = nameToMeshDic['flyLight'];
        const flyLightOpacityTween = gsap.to(flyLight.material, {
            opacity: 0,
            repeat: 0,
            ease: 'none',
            duration: 0.5,
            onComplete: ()=>{
                flyLightOpacityTween.kill();
            }
        });
        flyLight.userData['flyLightOpacityTween'] = flyLightOpacityTween;
    }
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
