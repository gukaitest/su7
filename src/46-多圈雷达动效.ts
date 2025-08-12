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

const groupRadar = new THREE.Group();

let curFuncIndex = 0;
let clipPlane01: THREE.Plane, clipPlane02: THREE.Plane;
const clipSpeed = 1;

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

const radarVertexArray: THREE.Vector3[] = [];
const vec3RadarLookAtTarget = new THREE.Vector3(0, 1.2, 0);
const radarMeshArray: THREE.Mesh[] = [];


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

        // if (child.name === 'mainCarShell') {
        //     child.visible = false;
        // }

        if (child.name === 'mainCarClip') {
            clipPlane01 = new THREE.Plane(new THREE.Vector3(1,0,0), 3.6);
            clipPlane02 = new THREE.Plane(new THREE.Vector3(-1,0,0), -3.55);

            // const clipPlane01Helper = new THREE.PlaneHelper(clipPlane01, 6, 0xff0000);
            // scene.add(clipPlane01Helper);
            // const clipPlane02Helper = new THREE.PlaneHelper(clipPlane02, 6, 0x00ff00);
            // scene.add(clipPlane02Helper);

            const clipMaterial = new THREE.MeshBasicMaterial({
                side: THREE.DoubleSide,
                clippingPlanes: [clipPlane01, clipPlane02]
            });

            child.material = clipMaterial;

            renderer.localClippingEnabled = true;
        }

        if (child.name === 'radar') {
            // console.log('radar', child);

            // console.log(child.geometry.attributes.position);

            const positionAttribute = child.geometry.getAttribute('position');
            console.log(positionAttribute);

            for (let i = 0; i < positionAttribute.count; i++) {
                const vec3 = new THREE.Vector3();
                vec3.fromBufferAttribute(positionAttribute, i);
                radarVertexArray.push(vec3);
            }

            // console.log(radarVertexArray);

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
            // onStart: ()=>{
            //     nameToMeshDic['mainCar'].visible = false;
            // }
            onStart: ()=>{
                nameToMeshDic['mainCarBody'].visible = false;
                nameToMeshDic['wheelFront'].visible = false;
                nameToMeshDic['wheelBack'].visible = false;
            }
        });

        const mainCarShell = nameToMeshDic['mainCarShell'];
        if (mainCarShell.userData['mainCarShellTween']) {
            mainCarShell.userData['mainCarShellTween'].kill();
        }
        const mainCarShellTween = gsap.to(mainCarShell.material, {
            alphaTest: 1,
            // delay: 0.1,
            duration: clipSpeed,
            repeat: 0,
            ease: 'none'
        })
        mainCarShell.userData['mainCarShellTween'] = mainCarShellTween;
        
        nameToMeshDic['windage'].visible = false;

        if (nameToMeshDic['mainCarClip'].userData['clipPlane01Tween']) {
            nameToMeshDic['mainCarClip'].userData['clipPlane01Tween'].kill();
        }
        clipPlane01.constant = -4;
        const clipPlane01Tween = gsap.to(clipPlane01, {
            constant: 3.6,
            duration: clipSpeed,
            repeat: 0,
            ease: 'none'
        });
        nameToMeshDic['mainCarClip'].userData['clipPlane01Tween'] = clipPlane01Tween;

        if (nameToMeshDic['mainCarClip'].userData['clipPlane02Tween']) {
            nameToMeshDic['mainCarClip'].userData['clipPlane02Tween'].kill();
        }
        clipPlane02.constant = 4.05;
        const clipPlane02Tween =gsap.to(clipPlane02, {
            constant: -3.55,
            duration: clipSpeed,
            repeat: 0,
            ease: 'none'
        });
        nameToMeshDic['mainCarClip'].userData['clipPlane02Tween'] = clipPlane02Tween;
    }

    if (curFuncIndex === 3) {

        if (radarMeshArray.length === 0) {

            const boxGeo = new THREE.BoxGeometry(0.05, 0.05, 0.2);
            scene.add(groupRadar);
            groupRadar.position.set(0, 1, 0);

            for (let i = 0; i < 6; i++) {

                for (let j = 0; j < radarVertexArray.length; j++) {
                    const boxMat = new THREE.MeshBasicMaterial({color: 0x00ff00});
                    const boxMesh = new THREE.Mesh(boxGeo, boxMat);
                    boxMesh.position.copy(radarVertexArray[j]);
                    boxMesh.visible = false;

                    groupRadar.add(boxMesh);
                    // scene.add(boxMesh);
    
                    radarMeshArray.push(boxMesh);
        
                    boxMesh.lookAt(vec3RadarLookAtTarget);
    
                    boxMesh.userData['originPos'] = boxMesh.position.clone();
                    boxMesh.translateZ(-6);
                    boxMesh.userData['targetPos'] = boxMesh.position.clone();
                    boxMesh.translateZ(6);

                    if (i === 0) {
                        boxMesh.userData['delay'] = 0;
                    } else if (i === 1) {
                        boxMesh.userData['delay'] = 0.5;
                    } else if (i === 2) {
                        boxMesh.userData['delay'] = 1;
                    } else if (i === 3) {
                        boxMesh.userData['delay'] = 2;
                    } else if (i === 4) {
                        boxMesh.userData['delay'] = 2.5;
                    } else if (i === 5) {
                        boxMesh.userData['delay'] = 3;
                    }
                }
    
                for (let k = 0; k < radarMeshArray.length; k++) {
                    gsap.to(radarMeshArray[k].position, {
                        x: radarMeshArray[k].userData['targetPos'].x,
                        y: radarMeshArray[k].userData['targetPos'].y,
                        z: radarMeshArray[k].userData['targetPos'].z,
                        duration: 4,
                        delay: radarMeshArray[k].userData['delay'],
                        repeat: -1,
                        ease: 'none',
                        onStart: ()=>{
                            radarMeshArray[k].userData['isTweening'] = true;
                            radarMeshArray[k].visible = true;
                        }
                    });
        
                }
            }

        }
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
            // onStart: ()=>{
            //     nameToMeshDic['mainCar'].visible = true;
            // }
            onStart: ()=>{
            }
        });

        const mainCarShell = nameToMeshDic['mainCarShell'];
        if (mainCarShell.userData['mainCarShellTween']) {
            mainCarShell.userData['mainCarShellTween'].kill();
        }
        const mainCarShellTween = gsap.to(mainCarShell.material, {
            alphaTest: 0,
            duration: clipSpeed,
            repeat: 0,
            ease: 'none'
        })
        mainCarShell.userData['mainCarShellTween'] = mainCarShellTween;

        if (nameToMeshDic['mainCarClip'].userData['clipPlane01Tween']) {
            nameToMeshDic['mainCarClip'].userData['clipPlane01Tween'].kill();
        }
        const clipPlane01Tween = gsap.to(clipPlane01, {
            constant: -4,
            duration: clipSpeed,
            repeat: 0,
            ease: 'none',
            onComplete: ()=>{
                nameToMeshDic['windage'].visible = true;
                nameToMeshDic['outLine'].visible = false;
                nameToMeshDic['mainCarBody'].visible = true;
                nameToMeshDic['wheelFront'].visible = true;
                nameToMeshDic['wheelBack'].visible = true;
            }
        });
        nameToMeshDic['mainCarClip'].userData['clipPlane01Tween'] = clipPlane01Tween;

        if (nameToMeshDic['mainCarClip'].userData['clipPlane02Tween']) {
            nameToMeshDic['mainCarClip'].userData['clipPlane02Tween'].kill();
        }
        const clipPlane02Tween =gsap.to(clipPlane02, {
            constant: 4.05,
            duration: clipSpeed,
            repeat: 0,
            ease: 'none'
        });
        nameToMeshDic['mainCarClip'].userData['clipPlane02Tween'] = clipPlane02Tween;
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
