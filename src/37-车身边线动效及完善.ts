import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
import { RGBELoader } from 'three/examples/jsm/Addons.js';
import { OrbitControls } from 'three/examples/jsm/Addons.js';

import { EffectComposer } from 'three/examples/jsm/Addons.js';
import { RenderPass } from 'three/examples/jsm/Addons.js';
import { UnrealBloomPass } from 'three/examples/jsm/Addons.js';

import gsap from 'gsap';

const nameToMeshDic: any = {};
let ground: any;

let curFuncIndex = 0;

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

renderer.setAnimationLoop(animationLoop);

document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x000000, 0.005);

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
camera.position.set(0, 1.5, 5);

const controls = new OrbitControls(camera, renderer.domElement);
controls.maxPolarAngle = 1.4;
controls.minPolarAngle = 0.1;

controls.maxDistance = 8;
controls.minDistance = 6;

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

        if (child.name === 'whiteLine') {
            child.visible = false;
            const whiteLine = child;
            const whiteLineOffsetTween = gsap.to(whiteLine.material.map.offset, {
                y: whiteLine.material.map.offset.y + 1,
                repeat: -1,
                ease: 'none',
                duration: 40
            });
            whiteLine.userData['whiteLineOffsetTween'] = whiteLineOffsetTween;
        }

        if (child.name === 'widthHeightDepth') {
            child.visible = false;
        }

        if (child.name === 'windage') {
            child.visible = false;
        }

        if (child.name === 'outLine') {
            child.visible = false;
        }
    });
});

let effectComposer: EffectComposer;
function initEffects() {
    effectComposer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    const urealBloomPass = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.5, 0.1, 0.1);

    effectComposer.addPass(renderPass);
    effectComposer.addPass(urealBloomPass);
}

initEffects();

const rgbeLoader = new RGBELoader();
rgbeLoader.load('sky.hdr',(skyTexture)=>{
    scene.background = skyTexture;
    scene.environment = skyTexture;
    skyTexture.mapping = THREE.EquirectangularReflectionMapping;
});

window.addEventListener('mousedown', (e)=>{
    // console.log(e);

    if (!(e.target instanceof HTMLCanvasElement)) {
        return;
    }

    if (curFuncIndex === 0) {
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
    
            const wheelFrontStartTween = gsap.to(wheelFront.rotation, {
                y: wheelFront.rotation.y + 4 * Math.PI,
                duration: 1,
                ease: 'power1.in',
                repeat: 0,
                onComplete: ()=>{
                    const wheelFrontTween = gsap.to(wheelFront.rotation, {
                        y: wheelFront.rotation.y + 2 * Math.PI,
                        duration: 0.3,
                        ease: 'none',
                        repeat: -1
                    });
                    wheelFront.userData['wheelFrontTween'] = wheelFrontTween;
    
                    // 相机震动
                    const tweenShakeX = gsap.to(camera.position, {
                        x: camera.position.x + 0.01,
                        duration: 0.1,
                        repeat: -1,
                        ease: 'power1.inOut',
                    });
                    camera.userData['tweenShakeX'] = tweenShakeX;
            
                    const tweenShakeY = gsap.to(camera.position, {
                        y: camera.position.y + 0.012,
                        duration: 0.12,
                        repeat: -1,
                        ease: 'power1.inOut',
                    });
                    camera.userData['tweenShakeY'] = tweenShakeY;
                }
            });
            wheelFront.userData['wheelFrontStartTween'] = wheelFrontStartTween;
    
            const wheelBack = nameToMeshDic['wheelBack'];
            const wheelbackStartTween = gsap.to(wheelBack.rotation, {
                y: wheelBack.rotation.y + 4 * Math.PI,
                duration: 1,
                ease: 'power1.in',
                repeat: 0,
                onComplete: ()=>{
                    const wheelbackTween = gsap.to(wheelBack.rotation, {
                        y: wheelBack.rotation.y + 2 * Math.PI,
                        duration: 0.3,
                        ease: 'none',
                        repeat: -1
                    });
                    wheelBack.userData['wheelbackTween'] = wheelbackTween;
                }
            });
            wheelBack.userData['wheelbackStartTween'] = wheelbackStartTween;
    
            const groundDetail = nameToMeshDic['groundDetail'];
            const groundDetailStartTween = gsap.to(groundDetail.material.map.offset, {
                x: groundDetail.material.map.offset.x + 1,
                repeat: 0,
                duration: 1,
                ease: 'power1.in',
                onComplete: ()=>{
                    const groundDetailTween = gsap.to(groundDetail.material.map.offset, {
                        x: groundDetail.material.map.offset.x + 10,
                        repeat: -1,
                        duration: 10,
                        ease: 'none'
                    });
                    groundDetail.userData['groundDetailTween'] = groundDetailTween;
                }
            });
            groundDetail.userData['groundDetailStartTween'] = groundDetailStartTween;
        }
    }

    if (curFuncIndex === 1) {

        gsap.to(camera, {
            fov: 80,
            duration: 0.5,
            repeat: 0,
            ease: 'power1.inOut',
            onUpdate: ()=>{
                camera.updateProjectionMatrix();
            }
        });

        nameToMeshDic['whiteLine'].visible = true;
        nameToMeshDic['widthHeightDepth'].visible = true;

        const whiteLine = nameToMeshDic['whiteLine'];
        if (whiteLine.userData['whiteLineTween']) {
            whiteLine.userData['whiteLineTween'].kill();
        }
        whiteLine.material.opacity = 0;
        const whiteLineTween = gsap.to(whiteLine.material, {
            opacity: 1,
            repeat: 0,
            duration: 2,
            ease: 'none',
        });
        whiteLine.userData['whiteLineTween'] = whiteLineTween;
    }

    if (curFuncIndex === 2) {
        gsap.to(camera, {
            fov: 80,
            duration: 0.5,
            repeat: 0,
            ease: 'power1.inOut',
            onUpdate: ()=>{
                camera.updateProjectionMatrix();
            }
        });

        const outLine = nameToMeshDic['outLine'];
        outLine.visible = true;

        gsap.to(outLine.material.map.offset, {
            x: outLine.material.map.offset.x + 1,
            repeat: -1,
            duration: 0.25,
            ease: 'none',
            onStart: ()=>{
                nameToMeshDic['mainCar'].visible = false;
            }
        });

    }

});

window.addEventListener('mouseup', (e)=>{
    // console.log(e);

    if (!(e.target instanceof HTMLCanvasElement)) {
        return;
    }

    if (curFuncIndex === 0) {
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
            if (nameToMeshDic['wheelFront'].userData['wheelFrontStartTween']) {
                nameToMeshDic['wheelFront'].userData['wheelFrontStartTween'].kill();
            }
            if (nameToMeshDic['wheelFront'].userData['wheelFrontTween']){
                nameToMeshDic['wheelFront'].userData['wheelFrontTween'].kill();
            }
            if (nameToMeshDic['wheelBack'].userData['wheelbackStartTween']) {
                nameToMeshDic['wheelBack'].userData['wheelbackStartTween'].kill();
            }
            if (nameToMeshDic['wheelBack'].userData['wheelbackTween']) {
                nameToMeshDic['wheelBack'].userData['wheelbackTween'].kill();
            }
            if (nameToMeshDic['wheelBack'].userData['tweenBackStartTween']) {
                nameToMeshDic['wheelBack'].userData['tweenBackStartTween'].kill();
            }
            if (nameToMeshDic['groundDetail'].userData['groundDetailTween']) {
                nameToMeshDic['groundDetail'].userData['groundDetailTween'].kill();
            }
            if (nameToMeshDic['groundDetail'].userData['groundDetailStartTween']) {
                nameToMeshDic['groundDetail'].userData['groundDetailStartTween'].kill();
            }
    
            if (camera.userData['tweenShakeX']) {
                camera.userData['tweenShakeX'].kill();
            }
            if (camera.userData['tweenShakeY']) {
                camera.userData['tweenShakeY'].kill();
            }
    
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
    
            const wheelFront = nameToMeshDic['wheelFront'];
    
            const wheelFrontStartTween = gsap.to(wheelFront.rotation, {
                y: wheelFront.rotation.y + 2 * Math.PI,
                duration: 0.3,
                ease: 'power1.out',
                repeat: 0,
            });
    
            const wheelBack = nameToMeshDic['wheelBack'];
            const wheelbackStartTween = gsap.to(wheelBack.rotation, {
                y: wheelBack.rotation.y + 2 * Math.PI,
                duration: 0.3,
                ease: 'power1.out',
                repeat: 0
            });
    
            const groundDetail = nameToMeshDic['groundDetail'];
            const groundDetailStopTween = gsap.to(groundDetail.material.map.offset, {
                x: groundDetail.material.map.offset.x + 0.05,
                repeat: 0,
                duration: 0.3,
                ease: 'power1.out',
            });
        }
    }

    if (curFuncIndex === 1) {

        gsap.to(camera, {
            fov: 60,
            duration: 0.5,
            repeat: 0,
            ease: 'power1.inOut',
            onUpdate: ()=>{
                camera.updateProjectionMatrix();
            }
        });

        // nameToMeshDic['whiteLine'].visible = false;
        nameToMeshDic['widthHeightDepth'].visible = false;

        const whiteLine = nameToMeshDic['whiteLine'];
        if (whiteLine.userData['whiteLineTween']) {
            whiteLine.userData['whiteLineTween'].kill();
        }
        const whiteLineTween = gsap.to(whiteLine.material, {
            opacity: 0,
            repeat: 0,
            duration: 1,
            ease: 'none',
            onComplete: ()=>{
                nameToMeshDic['whiteLine'].visible = false;
            }
        });
        whiteLine.userData['whiteLineTween'] = whiteLineTween;
    }

    if (curFuncIndex === 2) {
        gsap.to(camera, {
            fov: 60,
            duration: 0.5,
            repeat: 0,
            ease: 'power1.inOut',
            onUpdate: ()=>{
                camera.updateProjectionMatrix();
            },
            onStart: ()=>{
                nameToMeshDic['mainCar'].visible = true;
            }
        });

        nameToMeshDic['outLine'].visible = false;
    }
});

window.addEventListener('mousemove', ()=>{
    if (camera.userData['tweenShakeX']) {
        camera.userData['tweenShakeX'].kill();
    }
    if (camera.userData['tweenShakeY']) {
        camera.userData['tweenShakeY'].kill();
    }
})

const funcButtonTunnel = document.getElementById('funcButtonTunnel');
funcButtonTunnel?.addEventListener('click', ()=>{
    curFuncIndex = 0;
    console.log('funcButtonTunnel');

    nameToMeshDic['widthHeightDepth'].visible = false;
    nameToMeshDic['windage'].visible = false;
});

const funcButtonCarBody = document.getElementById('funcButtonCarBody');
funcButtonCarBody?.addEventListener('click', ()=>{
    curFuncIndex = 1;
    console.log('funcButtonCarBody');

    nameToMeshDic['widthHeightDepth'].visible = true;
    nameToMeshDic['windage'].visible = false;
});

const funcButtonWindage = document.getElementById('funcButtonWindage');
funcButtonWindage?.addEventListener('click', ()=>{
    curFuncIndex = 2;
    console.log('funcButtonWindage');

    nameToMeshDic['widthHeightDepth'].visible = false;
    nameToMeshDic['windage'].visible = true;

    const windage = nameToMeshDic['windage'];
    windage.material.opacity = 0;
    gsap.to(windage.material.map.offset, {
        x: windage.material.map.offset.x + 1,
        duration: 2,
        repeat: -1,
        ease: 'none',
    });
    gsap.to(windage.material, {
        opacity: 1,
        duration: 1,
        repeat: 0,
        ease: 'none'
    });
});

const funcButtonRadar = document.getElementById('funcButtonRadar');
funcButtonRadar?.addEventListener('click', ()=>{
    curFuncIndex = 3;
    console.log('funcButtonRadar');

    nameToMeshDic['widthHeightDepth'].visible = false;
    nameToMeshDic['windage'].visible = false;
});

window.addEventListener('resize', onWindowResize);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.updateProjectionMatrix();
}

function animationLoop() {
    controls.update();

    if (ground) {
        ground.visible = false;
        cubeCamera.position.copy(camera.position);
        cubeCamera.position.y = -cubeCamera.position.y;
        cubeCamera.update(renderer, scene);
        ground.visible = true;
    }

    // renderer.render(scene, camera);
    effectComposer.render();
}
