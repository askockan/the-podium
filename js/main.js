import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const header = document.getElementById('heading');
const modelSlider = document.getElementById('model-slider');
const modelKg = document.getElementById('modelkg');
const navbutton = document.getElementById('navbutton');
const sidenav = document.getElementById('sidenav');
const sideNavCSS = window.getComputedStyle(sidenav, null);
const carinfo = document.getElementById('carinfo');
const progress = document.getElementById('progress');
const loadInfo = document.getElementById('load-info');

const sf23 = document.getElementById('sf23');
const rb19 = document.getElementById('rb19');

let container;
let camera, scene, renderer;
let loader;
let controller, controls;
let groundGeometry, groundTexture, groundMaterial, groundMesh
let display_model;

let reticle;

let hitTestSource = null;
let hitTestSourceRequested = false;
let ar_scene_model = null;

init();
animate();

document.getElementById("ARButton").addEventListener('click', () => {
    display_model.visible = false;
    display_model.scale.set(base_scale);
})

function init() {

    navbutton.addEventListener('click', () => {
        let sideNavMarginL = sideNavCSS.getPropertyValue('margin-left');
        if (sideNavMarginL == '-215px') {
            sidenav.style.marginLeft = '0';
            navbutton.classList.toggle('active');
        } else {
            sidenav.style.marginLeft = '-215px';
            navbutton.classList.toggle('active');
        }
    })
    
    //
    let lastVal = modelSlider.defaultValue;
    modelSlider.addEventListener('input', (e) => {
        if (display_model) {

            if (lastVal) {
                if(lastVal > e.target.value) {
                    display_model.scale.addScalar(-0.1);
                } else {
                    display_model.scale.addScalar(0.1);
                }
                lastVal = e.target.value;
            }

            ambientLight.intensity = e.target.value*11;
            let currentKg = 533*e.target.value
            modelKg.innerHTML = Math.round(currentKg) + " " + "KG";
        }
    });
    
    //

    container = document.createElement( 'div' );
    document.getElementById('model').appendChild( container );

    //

    scene = new THREE.Scene();

    //

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 1000);
    camera.position.set(0, 5, 11);

    //

    const spotLight = new THREE.SpotLight(0xffffff, 2000, 100, 0.22, 1);
    spotLight.position.set(0, 15, 0);
    spotLight.castShadow = true;
    spotLight.shadow.bias = -0.0001;
    scene.add(spotLight);

    const ambientLight = new THREE.AmbientLight(0x404040, 15);
    ambientLight.position.set(1, 0, 0);
    spotLight.castShadow = false;
    scene.add(ambientLight);

    //

    renderer = new THREE.WebGLRenderer( { antialias: true, alpha: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.setAnimationLoop( animate );
    renderer.xr.enabled = true;
    container.appendChild( renderer.domElement );

    //

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.enablePan = false;
    controls.minDistance = 2;
    controls.maxDistance = 20;
    controls.minPolarAngle = 0.5;
    controls.maxPolarAngle = 1.6;
    controls.autoRotate = false;
    controls.target = new THREE.Vector3(0, 1, 0);
    controls.update();
    
    //

    let options = {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay']
    }

    options.domOverlay = {root: document.getElementById("content")};
    document.body.appendChild( ARButton.createButton(renderer, options));
    
    //

    groundGeometry = new THREE.PlaneGeometry(10, 10);
    groundGeometry.rotateX(-Math.PI / 2);
    groundTexture = new THREE.TextureLoader().load('models/ground/asphalt.jpg');
    groundTexture.wrapS = THREE.RepeatWrapping;
    groundTexture.repeat.set(1, 1);
    groundTexture.anisotropy = 2;
    groundMaterial = new THREE.MeshStandardMaterial( { 
    map: groundTexture,
    side: THREE.DoubleSide 
    } );
    groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.castShadow = false;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

    //

    rb19.addEventListener("click", () => modelLoader('rb19', 'Oracle Red Bull F1 RB19', 2, 2.7, 1.5, 'linear-gradient(to top, #F59631, #1E41A0)', '#F59631'));
    sf23.addEventListener("click", () => modelLoader('sf23', 'Scuderia Ferrari F1 SF23', 1.5, 2.2, 1, 'linear-gradient(to top, #c31432, #240b36)', '#c31432'));


    //default
    loader = new GLTFLoader().setPath('models/sf23/');
    loader.load('sf23.glb', (gltf) => {
        display_model = gltf.scene;
        display_model.traverse((child) => {
            if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
            }
        });

        display_model.position.set(0, 0, 0);
        display_model.scale.set(1.5, 1.5, 1.5);
        const base_scale = display_model.scale;
        scene.add(display_model);

        progress.style.display = 'none';
        loadInfo.style.display = 'none';
    }, (xhr) => {
        let roundedload = Math.round(`${xhr.loaded / xhr.total * 100}`);
        loadInfo.innerHTML= `loading ${roundedload}%`;
    }, (error) => {
        console.error(error);
    });

    function onSelect() {
        if ( reticle.visible && display_model ) {
            if (ar_scene_model) {
                scene.remove(ar_scene_model);
            }
            reticle.matrix.decompose( display_model.position, display_model.quaternion, display_model.scale );
            display_model.scale.y = Math.random() * 2 + 1;
            scene.add( display_model );

            ar_scene_model = display_model;
            
            display_model.position.setFromMatrixPosition(reticle.matrix);
            display_model.visible = true;

        }

    }

    controller = renderer.xr.getController( 0 );
    controller.addEventListener( 'select', onSelect );
    scene.add( controller );

    reticle = new THREE.Mesh(
        new THREE.RingGeometry( 0.15, 0.2, 32 ).rotateX( - Math.PI / 2 ),
        new THREE.MeshBasicMaterial()
    );
    reticle.matrixAutoUpdate = false;
    reticle.visible = false;
    scene.add( reticle );

    //

    window.addEventListener( 'resize', onWindowResize );

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

//

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
                display_model.scale.set(base_scale);
            } );
            hitTestSourceRequested = true;
        }
        if ( hitTestSource ) {
            const hitTestResults = frame.getHitTestResults( hitTestSource );
            if ( hitTestResults.length ) {
                const hit = hitTestResults[ 0 ];
                reticle.visible = true;
                reticle.matrix.fromArray( hit.getPose( referenceSpace ).transform.matrix );
            } else {
                reticle.visible = false;
            }
        }
    }
    renderer.render( scene, camera );
}

function modelLoader(modelName, carInfoText, baseScale, maxScale, minScale, bgColor, textColor) {
    scene.remove(display_model);
    progress.style.display = 'flex';
    loadInfo.style.display = 'flex';
    document.body.style.background = bgColor;
    carinfo.style.color = textColor;
    carinfo.style.borderColor = textColor;
    header.style.color = textColor;
    modelSlider.value = baseScale;
    modelSlider.max = maxScale;
    modelSlider.min = minScale;
    modelKg.innerHTML = `${533 * baseScale} KG`;
    sidenav.style.marginLeft = '-215px';
    navbutton.classList.toggle('active');

    loader = new GLTFLoader().setPath(`models/${modelName}/`);
    loader.load(`${modelName}.glb`, (gltf) => {
        display_model = gltf.scene;
        display_model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        display_model.position.set(0, 0, 0);
        display_model.scale.set(baseScale, baseScale, baseScale);
        scene.add(display_model);

        carinfo.style.display = 'fixed';
        carinfo.innerHTML = carInfoText;
        progress.style.display = 'none';
        loadInfo.style.display = 'none';
    }, (xhr) => {
        let roundedload = Math.round(`${xhr.loaded / xhr.total * 100}`);
        loadInfo.innerHTML= `loading ${roundedload}%`;
    }, (error) => {
        console.error(error);
    });
}

export function userModelLoader(fileUrl) {
    progress.style.display = 'flex';
    loadInfo.style.display = 'flex';
    scene.remove(display_model);
    loader = new GLTFLoader();
    loader.load(fileUrl, (gltf) => {
        display_model = gltf.scene;

        let model = display_model;
        let bbox = new THREE.Box3().setFromObject(model);
        let center = bbox.getCenter(new THREE.Vector3());
        let size = bbox.getSize(new THREE.Vector3());

        let maxAxis = Math.max(size.x, size.y, size.z);
        model.scale.multiplyScalar(7 / maxAxis);
        bbox.setFromObject(model);
        bbox.getCenter(center);
        bbox.getSize(size);

        model.position.copy(center).multiplyScalar(-1);
        model.position.y = 0;
        
        
        display_model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        URL.revokeObjectURL(fileUrl);

        modelSlider.value = 1.5;
        modelSlider.max = 2.5;
        modelSlider.min = 1;

        const base_scale = display_model.scale;
        console.log(base_scale);
        scene.add(display_model);

        carinfo.style.display = 'none';
        progress.style.display = 'none';
        loadInfo.style.display = 'none';
    }, (xhr) => {
        let roundedload = Math.round(`${xhr.loaded / xhr.total * 100}`);
        loadInfo.innerHTML= `loading ${roundedload}%`;
    }, (error) => {
        console.error(error);
    });
}

function modelLoader(modelName, carInfoText, baseScale, maxScale, minScale, bgColor, textColor) {
    scene.remove(display_model);
    progress.style.display = 'flex';
    loadInfo.style.display = 'flex';
    document.body.style.background = bgColor;
    carinfo.style.color = textColor;
    carinfo.style.borderColor = textColor;
    header.style.color = textColor;
    modelSlider.value = baseScale;
    modelSlider.max = maxScale;
    modelSlider.min = minScale;
    modelKg.innerHTML = `${533 * baseScale} KG`;
    sidenav.style.marginLeft = '-215px';
    navbutton.classList.toggle('active');

    loader = new GLTFLoader().setPath(`models/${modelName}/`);
    loader.load(`${modelName}.glb`, (gltf) => {
        display_model = gltf.scene;
        display_model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        display_model.position.set(0, 0, 0);
        display_model.scale.set(baseScale, baseScale, baseScale);
        scene.add(display_model);

        carinfo.style.display = 'fixed';
        carinfo.innerHTML = carInfoText;
        progress.style.display = 'none';
        loadInfo.style.display = 'none';
    }, (xhr) => {
        let roundedload = Math.round(`${xhr.loaded / xhr.total * 100}`);
        loadInfo.innerHTML= `loading ${roundedload}%`;
    }, (error) => {
        console.error(error);
    });
}
