// 导入Three.js核心库
import * as THREE from 'three';
// 导入GLTF模型加载器，用于加载3D模型文件
import { GLTFLoader } from 'three/examples/jsm/Addons.js';
// 导入HDR环境贴图加载器，用于加载高动态范围环境贴图
import { RGBELoader } from 'three/examples/jsm/Addons.js';
// 导入轨道控制器，用于实现鼠标交互控制相机
import { OrbitControls } from 'three/examples/jsm/Addons.js';

// 声明汽车模型变量，用于后续操作
let carMain;

// 创建WebGL渲染器
const renderer = new THREE.WebGLRenderer();
// 设置渲染器尺寸为窗口大小
renderer.setSize(window.innerWidth, window.innerHeight);
// 设置设备像素比，确保在高分辨率屏幕上清晰显示
renderer.setPixelRatio(window.devicePixelRatio);

// 设置动画循环函数
renderer.setAnimationLoop(animationLoop);

// 将渲染器的canvas元素添加到页面body中
document.body.appendChild(renderer.domElement);

// 创建场景对象
const scene = new THREE.Scene();

// 创建一个立方体几何体，参数为宽、高、深
const boxGeo = new THREE.BoxGeometry(1, 1, 1);
// 创建基础材质，设置为绿色
const boxMat = new THREE.MeshBasicMaterial({color: 0x00ff00});
// 将几何体和材质组合成网格对象
const boxMesh = new THREE.Mesh(boxGeo, boxMat);
// 将立方体添加到场景中
scene.add(boxMesh);

// 创建透视相机，参数：视野角度、宽高比、近裁剪面、远裁剪面
const camera = new THREE.PerspectiveCamera(60, window.innerWidth/window.innerHeight, 0.1, 100);
// 设置相机位置
camera.position.set(0, 0, 5);

// 创建轨道控制器，实现鼠标拖拽、缩放等交互
const controls = new OrbitControls(camera, renderer.domElement);

// 创建立方体贴图渲染目标，用于环境反射
// 1024是纹理分辨率，数值越大质量越高但性能消耗越大
const cubeRendererTarget = new THREE.WebGLCubeRenderTarget(1024);
// 设置纹理类型为半精度浮点型，提高渲染质量
cubeRendererTarget.texture.type = THREE.HalfFloatType;

// 创建立方体相机，用于捕获场景的六个方向作为环境贴图
// 参数：近裁剪面、远裁剪面、渲染目标
const cubeCamera = new THREE.CubeCamera(0.1, 100, cubeRendererTarget);

// 创建标准材质，支持PBR（基于物理的渲染）
const material = new THREE.MeshStandardMaterial( {
    // 设置环境贴图，用于反射效果
    envMap: cubeRendererTarget.texture,
    // 粗糙度，0为完全光滑，1为完全粗糙
    roughness: 0.05,
    // 金属度，0为非金属，1为完全金属
    metalness: 1
} );

// 创建球体几何体，半径为1
const sphereGeo = new THREE.SphereGeometry(1);
// 创建标准材质，设置为完全金属质感
const sphereMat = new THREE.MeshStandardMaterial({metalness: 1, roughness: 0});
// 注释掉原来的球体材质
// const sphereMesh = new THREE.Mesh(sphereGeo, sphereMat);
// 使用带环境反射的材质创建球体
const sphereMesh = new THREE.Mesh(sphereGeo, material);
// 将球体添加到场景中
scene.add(sphereMesh);
// 设置球体位置，向上移动4个单位
sphereMesh.position.set(0, 4, 0);

// 创建GLTF加载器实例
const gltfLoader = new GLTFLoader();
// 加载汽车模型文件
gltfLoader.load('car.glb', (gltf)=>{
    // 将加载的模型添加到场景中
    scene.add(gltf.scene);
    // 保存汽车模型引用
    carMain = gltf.scene;

    // 设置汽车模型位置，向右移动10个单位
    carMain.position.set(10, 0, 0);
});

// 创建HDR环境贴图加载器实例
const rgbeLoader = new RGBELoader();
// 加载HDR天空贴图
rgbeLoader.load('sky.hdr',(skyTexture)=>{
    // 将HDR贴图设置为场景背景
    scene.background = skyTexture;
    // 将HDR贴图设置为场景环境贴图，用于反射
    scene.environment = skyTexture;
    // 设置贴图映射方式为等距矩形映射
    skyTexture.mapping = THREE.EquirectangularReflectionMapping;
});

// 动画循环函数，每帧执行
function animationLoop() {
    // 渲染场景
    renderer.render(scene, camera);
    // 更新控制器状态
    controls.update();

    // 更新立方体相机，捕获当前场景作为环境贴图
    cubeCamera.update(renderer, scene);

    // 让立方体向上移动，实现简单的动画效果
    boxMesh.position.setY(boxMesh.position.y + 0.01);
}
