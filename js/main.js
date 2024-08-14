import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const sideNav = document.getElementById('sidenav');
const menuOpenBtn = document.getElementById('menuOpenButton');
const content = document.querySelector('.content');
const modelinfo = document.getElementById('modelinfo');
const progress = document.getElementById('progress');
const loadInfo = document.getElementById('load-info');
const resetBtn = document.getElementById('reset');

//
const arPlaceBtn = document.getElementById('ar-place');
const arScaleSlider = document.getElementById('ar-scale');
const arScaleKg = document.getElementById('ar-scale-kg');
const arRemoveBtn = document.getElementById('ar-remove');
//

const sf23 = document.getElementById('sf23');
const rb19 = document.getElementById('rb19');
const artest = document.getElementById('artest');

let container;
let camera, scene, renderer;
let loader;
let controller, controls;
let display_model, preview_model;

let reticle;

let hitTestSource = null;
let hitTestSourceRequested = false;

init();
animate();

document.getElementById("ARButton").addEventListener('click', async () => {
    if (navigator.xr) {
        try {
            let supported = await navigator.xr.isSessionSupported('immersive-ar');
            if (supported) {
            display_model.visible = false;
            display_model.scale.set(0.25, 0.25, 0.25);
            } else {
            alert("This device does not support immersive-ar session.");
            }
        } catch (error) {
            alert("Error checking 'immersive-ar' support:", error);
        }
    } else {
        alert("This browser does not support WebXR.");
    }
});

function checkIntersections(touchOrigin, directionFromCamera) {
    let raycaster = new THREE.Raycaster();
    raycaster.set(touchOrigin, directionFromCamera)
    const intersections = raycaster.intersectObject(scene.children[3], true);
    if (intersections.length > 0) {
        return intersections[0];
    } else {
        return null;
    }
}

//TO-DO: find more convenient way instead of 'touchOrigin'
function anchor() {
    const touchOrigin = new THREE.Vector3().setFromMatrixPosition(controller.matrixWorld);
    const cameraPosition = new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
    const directionFromCamera = touchOrigin.clone().sub(cameraPosition).normalize();
    const intersection = checkIntersections(touchOrigin, directionFromCamera);

    if (intersection) {
        const intersectionPoint = intersection.point;
        display_model.position.copy(intersectionPoint);
        display_model.visible = true;
    }
}

function arRemove() {
    if ( reticle.visible && display_model.visible == true) {
        display_model.visible = false;
    }
}

function arPlace() {
    if ( reticle.visible && display_model ) {
        display_model.position.setFromMatrixPosition(reticle.matrix);
        display_model.visible = true;
    }
}

arPlaceBtn.addEventListener('click', () => arPlace());
arRemoveBtn.addEventListener('click', () => arRemove());

arScaleSlider.addEventListener('input', (e) => {
    display_model.scale.set(e.target.value, e.target.value, e.target.value);
    let arModelKg = e.target.value * 4;
    arScaleKg.innerHTML = `${arModelKg} KG`;
})

function init() {
    let menuCurrent = "closed";
    menuOpenBtn.addEventListener('click', () => {
        content.classList.toggle('open');
        if (menuCurrent == "closed") {
            menuCurrent = "open";
            menuOpenBtn.setAttribute('name', 'chevron-back-sharp');
            sideNav.classList.toggle('open');
        } else {
            menuOpenBtn.setAttribute('name', 'menu-sharp');
            sideNav.classList.toggle('open');
            menuCurrent = "closed";
        }
    })

    // Reset Controls
    function resetModel() {
        controls.reset();
    }
    
    resetBtn.addEventListener('click', () => {
        resetModel();
    })

    // Scene HTML

    container = document.createElement( 'div' );
    document.getElementById('model').appendChild( container );

    // Scene and Camera

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Lights
    // TO-DO: add sliders to modify lightning based on VALUE not input
    const spotLight1 = new THREE.SpotLight(0xffffff, 600, 100, 0.22, 1);
    spotLight1.position.set(0, 15, 0);
    spotLight1.castShadow = true;
    spotLight1.shadow.bias = -0.0001;
    scene.add(spotLight1);
    const spotLight2 = new THREE.SpotLight(0xffffff, 600, 100, 0.22, 1);
    spotLight2.position.set(15, 0, 0);
    spotLight2.castShadow = true;
    spotLight2.shadow.bias = -0.0001;
    scene.add(spotLight2);
    const spotLight3 = new THREE.SpotLight(0xffffff, 600, 100, 0.22, 1);
    spotLight3.position.set(0, 0, 15);
    spotLight3.castShadow = true;
    spotLight3.shadow.bias = -0.0001;
    scene.add(spotLight3);
    const spotLight4 = new THREE.SpotLight(0xffffff, 600, 100, 0.22, 1);
    spotLight4.position.set(-15, 0, 0);
    spotLight4.castShadow = true;
    spotLight4.shadow.bias = -0.0001;
    scene.add(spotLight4);

    const ambientLight = new THREE.AmbientLight(0x404040, 60);
    ambientLight.position.set(1, 1, 0);
    /* spotLight.castShadow = false; */
    scene.add(ambientLight);

    // three.js Renderer

    renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setAnimationLoop( animate );
    renderer.xr.enabled = true;
    container.appendChild( renderer.domElement );

    // Scene Orbit Controls

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.enablePan = true;
    controls.autoRotate = false;
    
    // AR Button and AR Settings Setup

    let options = {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay']
    }

    options.domOverlay = {root: document.getElementById("ar-content")};
    document.getElementById('navAR').appendChild( ARButton.createButton(renderer, options));
    
    // Pre-Uploaded Models

    rb19.addEventListener("click", () => modelLoader('rb19', 'Oracle Red Bull F1 RB19 '));
    sf23.addEventListener("click", () => modelLoader('sf23', 'Scuderia Ferrari F1 SF23 '));
    artest.addEventListener("click", () => modelLoader('artest', 'AR Test Model '));

    // Default Model and Check For Params
    const urlParams = new URLSearchParams(window.location.search);
    const model = urlParams.get('model')
    if (!model) {
        loader = new GLTFLoader().setPath('models/sf23/');
        loader.load('sf23.glb', (gltf) => {
        display_model = gltf.scene;
        display_model.traverse((child) => {
            if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            }
        });

        display_model.updateMatrixWorld();

        const box = new THREE.Box3().setFromObject(display_model);
		const size = box.getSize(new THREE.Vector3()).length();
		const center = box.getCenter(new THREE.Vector3());

        display_model.position.x -= center.x;
        display_model.position.y -= center.y;
		display_model.position.z -= center.z;
        controls.maxDistance = size * 10;
		camera.near = size / 100;
		camera.far = size * 100;
        camera.updateProjectionMatrix();
		
        camera.position.copy(center);
        camera.position.x += size / 1.6;
        camera.position.y += size / 6.0;
        camera.position.z += size / 1.6;
        camera.lookAt(center);
        controls.target = center;
        controls.saveState();
        controls.update();
        
        scene.add(display_model);

        progress.style.display = 'none';
        loadInfo.style.display = 'none';
    }, (xhr) => {
        let roundedload = Math.round(`${xhr.loaded / xhr.total * 100}`);
        loadInfo.innerHTML= `${roundedload}%`;
    }, (error) => {
        console.error(error);
    });
    }

    // AR Controller

    controller = renderer.xr.getController( 0 );
    controller.addEventListener('select', anchor);
    scene.add( controller );

    reticle = new THREE.Mesh(
        new THREE.RingGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
        new THREE.MeshBasicMaterial()
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add( reticle );

    // Resize Listener

    window.addEventListener( 'resize', onWindowResize );
}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

// Web - AR Scene Render Function

function animate( timestamp, frame ) {
    if ( frame ) {
        const referenceSpace = renderer.xr.getReferenceSpace();
        const session = renderer.xr.getSession();

        if ( hitTestSourceRequested === false ) {

            session.requestReferenceSpace( 'viewer' ).then( function ( referenceSpace ) {

                session.requestHitTestSource( { space: referenceSpace } ).then( function ( source ) {
                    hitTestSource = source;
                } );
            } );
            session.addEventListener( 'end', function () {
                hitTestSourceRequested = false;
                hitTestSource = null;

                reticle.visible = false;
                arPlaceBtn.style.display = 'none';
                arScaleSlider.style.display = 'none';
                arScaleKg.style.display = 'none';
                arRemoveBtn.style.display = 'none';
                
                window.location.href = 'index.html';
            } );
            hitTestSourceRequested = true;
        }
        if ( hitTestSource ) {
            const hitTestResults = frame.getHitTestResults( hitTestSource );
            if ( hitTestResults.length ) {
                const hit = hitTestResults[ 0 ];

                arPlaceBtn.style.display = 'block';
                arScaleSlider.style.display = 'block';
                arScaleKg.style.display = 'block';
                arRemoveBtn.style.display = 'block';
                reticle.visible = true;

                reticle.matrix.fromArray( hit.getPose( referenceSpace ).transform.matrix );
            } else {
                reticle.visible = false;
                arPlaceBtn.style.display = 'none';
                arScaleSlider.style.display = 'none';
                arScaleKg.style.display = 'none';
                arRemoveBtn.style.display = 'none';
            }
        }
    }
    renderer.render( scene, camera );
}

// Pre-Uploaded Model Loader
function modelLoader(modelName, modelinfoText) {
    scene.remove(display_model);
    progress.style.display = 'flex';
    loadInfo.style.display = 'flex';
    modelinfo.style.display = 'block';
    modelinfo.innerHTML = modelinfoText;

    loader = new GLTFLoader().setPath(`models/${modelName}/`);
    loader.load(`${modelName}.glb`, (gltf) => {
        display_model = gltf.scene;
        let renderOrder = 1;
        display_model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }   
            child.renderOrder = renderOrder;
                renderOrder++;
        });

        display_model.updateMatrixWorld();

        const box = new THREE.Box3().setFromObject(display_model);
		const size = box.getSize(new THREE.Vector3()).length();
		const center = box.getCenter(new THREE.Vector3());

        display_model.position.x -= center.x;
        display_model.position.y -= center.y;
		display_model.position.z -= center.z;
        controls.maxDistance = size * 10;
		camera.near = size / 100;
		camera.far = size * 100;
        camera.updateProjectionMatrix();
		
        camera.position.copy(center);
        camera.position.x += size / 1.6;
        camera.position.y += size / 6.0;
        camera.position.z += size / 1.6;
        camera.lookAt(center);
        controls.target = center;
        controls.saveState();
        controls.update();

        scene.add(display_model);

        progress.style.display = 'none';
        loadInfo.style.display = 'none';
        controls.reset();
        controls.update();
    }, (xhr) => {
        let roundedload = Math.round(`${xhr.loaded / xhr.total * 100}`);
        loadInfo.innerHTML= `loading ${roundedload}%`;
    }, (error) => {
        console.error(error);
    });
}

// User Model Loader
export function userModelLoader(fileUrl) {
    progress.style.display = 'flex';
    loadInfo.style.display = 'flex';
    scene.remove(display_model);
    loader = new GLTFLoader();
    loader.load(fileUrl, (gltf) => {
        display_model = gltf.scene;
        
        display_model.updateMatrixWorld();

        const box = new THREE.Box3().setFromObject(display_model);
		const size = box.getSize(new THREE.Vector3()).length();
		const center = box.getCenter(new THREE.Vector3());

        display_model.position.x -= center.x;
        display_model.position.y -= center.y;
		display_model.position.z -= center.z;
        controls.maxDistance = size * 10;
		camera.near = size / 100;
		camera.far = size * 100;
        camera.updateProjectionMatrix();
		
        camera.position.copy(center);
        camera.position.x += size / 1.6;
        camera.position.y += size / 6.0;
        camera.position.z += size / 1.6;
        camera.lookAt(center);
        controls.target = center;
        controls.saveState();
        controls.update();

        let renderOrder = 1;
        display_model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
            child.renderOrder = renderOrder;
                renderOrder++;
        });

        URL.revokeObjectURL(fileUrl);

        scene.add(display_model);

        progress.style.display = 'none';
        loadInfo.style.display = 'none';
        const urlParams = new URLSearchParams(window.location.search);
        const model = urlParams.get('model')
        if (model) {
            let modeltext = model.split('.')[0];
            modeltext = modeltext.charAt(0).toUpperCase() + modeltext.slice(1);
            modelinfo.innerHTML = modeltext;
        } else {
            modelinfo.style.display = 'none';
        }
    }, (xhr) => {
        let roundedload = Math.round(`${xhr.loaded / xhr.total * 100}`);
        loadInfo.innerHTML= `loading ${roundedload * 100 / 100}%`;
    }, (error) => {
        console.error(error);
    });
}

// Preview Image Generator
export async function previewImgCapture(url) {
    return new Promise((resolve, reject) => {
        const previewLoader = new GLTFLoader();
        const previewScene = new THREE.Scene();

        previewLoader.load(url, (gltf) => {
            preview_model = gltf.scene;
            preview_model.scale.set(1, 1, 1)
            const previewCamera = new THREE.PerspectiveCamera(65, 1, 0.1, 1000);
            
            const box = new THREE.Box3().setFromObject(preview_model);
            const size = box.getSize(new THREE.Vector3()).length();
            const center = box.getCenter(new THREE.Vector3());
            preview_model.position.x = 0;
            preview_model.position.y = 0;
            preview_model.position.z = 0;
            previewCamera.position.copy(center);
            previewCamera.position.x += size / 2;
            previewCamera.position.y += size / 2.25; 
            previewCamera.position.z += size / 1.75;
            previewCamera.lookAt(center);
    
            const canvas = document.createElement('canvas');
            canvas.width = 128;
            canvas.height = 128;
        
            const previewRenderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
            previewRenderer.setSize(canvas.width, canvas.height);
            const previewLightD = new THREE.DirectionalLight(0xffffff, 5);
            previewLightD.position.set(5, 5, 5).normalize();
            const previewLightA = new THREE.AmbientLight(0x404040, 4);
            previewScene.add(previewLightD);
            previewScene.add(previewLightA);
            previewScene.add(preview_model);
    
            previewRenderer.render(previewScene, previewCamera);
            const imgURL = canvas.toDataURL('image/png');
            if (imgURL) {
                resolve(imgURL);
            } else {
                reject("ERR");
            }
        }, undefined, undefined, (error) => {
            reject(error);
        });
    });
}

document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("ARButton").innerHTML = "View in AR";
    document.getElementById("ARButton").style.position = 'unset';
})