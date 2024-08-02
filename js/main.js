import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const header = document.getElementById('heading');
const modelSlider = document.getElementById('model-slider');
const kgInfo = document.querySelector('.kginfo');
const modelKg = document.getElementById('modelkg');
const navbutton = document.getElementById('navbutton');
const sidenav = document.getElementById('sidenav');
const sideNavCSS = window.getComputedStyle(sidenav, null);
const carinfo = document.getElementById('carinfo');
const progress = document.getElementById('progress');
const loadInfo = document.getElementById('load-info');
const xAxisSlider = document.getElementById('x-slider');
const yAxisSlider = document.getElementById('y-slider');
const sliderResetBtn = document.getElementById('reset');
//
const arContent = document.getElementById('ar-content');
const arPlaceBtn = document.getElementById('ar-place');
const arScaleSlider = document.getElementById('ar-scale');
const arScaleKg = document.getElementById('ar-scale-kg');

const sf23 = document.getElementById('sf23');
const rb19 = document.getElementById('rb19');
const artest = document.getElementById('artest');

let container;
let camera, scene, renderer;
let loader;
let controller, controls;
let display_model;

let reticle;

let hitTestSource = null;
let hitTestSourceRequested = false;

init();
animate();

document.getElementById("ARButton").addEventListener('click', () => {
    display_model.visible = false;
    camera.fov = 75;
    camera.updateProjectionMatrix();
})

function arPlace() {
    if ( reticle.visible && display_model ) {
        display_model.position.setFromMatrixPosition(reticle.matrix);
        display_model.visible = true;
    }
}

arPlaceBtn.addEventListener('click', () => arPlace())

arScaleSlider.addEventListener('input', (e) => {
    display_model.scale.set(e.target.value, e.target.value, e.target.value);
    let arModelKg = e.target.value * 4;
    arScaleKg.innerHTML = `${arModelKg} KG`;
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
    // TO-DO: works fine on slow slide, problem with clicks on slider.
    let lastVal = modelSlider.defaultValue;
    modelSlider.addEventListener('input', (e) => {
        if (display_model) {
            if (lastVal) {
                if(lastVal > e.target.value) {
                    if(display_model.scale.getComponent(0) > 0.1 || display_model.scale.getComponent(1) > 0.1 || display_model.scale.getComponent(2) > 0.1 ) {
                        display_model.scale.addScalar(-0.1);
                    } else {
                        lastVal = e.target.value;
                        return;
                    } 
                } else {
                    display_model.scale.addScalar(0.1);
                }
                lastVal = e.target.value;
            }

            let currentKg = 533*e.target.value
            modelKg.innerHTML = Math.round(currentKg) + " " + "KG";
        }
    });

    xAxisSlider.addEventListener('input', (e) => {
        if (display_model) {
            if (e.target.value) {
                display_model.position.setX(e.target.value - 2);
            }
        }
    });

    yAxisSlider.addEventListener('input', (e) => {
        if (display_model) {
            if (e.target.value) {
                display_model.position.setY(e.target.value - 2);
            }
        }
    });
    
    function resetModel() {
        controls.reset();
        controls.update();
        let x = modelSlider.value - modelSlider.defaultValue;
        const roundedX = Math.floor(x * 100) / 100;
        display_model.scale.set(modelSlider.value - roundedX, modelSlider.value - roundedX, modelSlider.value - roundedX);
        display_model.position.setY(0);
        display_model.position.setX(0);
        modelSlider.value = modelSlider.defaultValue;
        lastVal = modelSlider.defaultValue;
        xAxisSlider.value = xAxisSlider.defaultValue;
        yAxisSlider.value = yAxisSlider.defaultValue;
        let displayKG = Math.round(533 * modelSlider.defaultValue);
        modelKg.innerHTML = `${displayKG} KG`;   
    }
    
    sliderResetBtn.addEventListener('click', () => {
        resetModel();
    })

    //

    container = document.createElement( 'div' );
    document.getElementById('model').appendChild( container );

    //

    scene = new THREE.Scene();

    //

    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, 11);

    //


    // TO-DO: make this optional with button smt..
    /* const spotLight = new THREE.SpotLight(0xffffff, 2000, 100, 0.22, 1);
    spotLight.position.set(0, 15, 0);
    spotLight.castShadow = true;
    spotLight.shadow.bias = -0.0001;
    scene.add(spotLight); */

    const ambientLight = new THREE.AmbientLight(0x404040, 100);
    ambientLight.position.set(1, 1, 0);
    /* spotLight.castShadow = false; */
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
    controls.minDistance = 3;
    controls.maxDistance = 20;
    controls.autoRotate = false;
    controls.target = new THREE.Vector3(0, 1, 0);
    controls.saveState();
    controls.update();
    
    //

    let options = {
        requiredFeatures: ['hit-test'],
        optionalFeatures: ['dom-overlay']
    }

    options.domOverlay = {root: document.getElementById("ar-content")};
    document.body.appendChild( ARButton.createButton(renderer, options));
    
    //

    rb19.addEventListener("click", () => modelLoader('rb19', 'Oracle Red Bull F1 RB19 ', 2, 2.7, 1.5, 'linear-gradient(to top, #F59631, #1E41A0)', '#F59631'));
    sf23.addEventListener("click", () => modelLoader('sf23', 'Scuderia Ferrari F1 SF23 ', 1.5, 2.2, 1, 'linear-gradient(to top, #c31432, #240b36)', '#c31432'));
    artest.addEventListener("click", () => modelLoader('artest', 'AR Test Model ', 1, "" , "", 'linear-gradient(to top, #636363, #a2ab58)', '#636363'))


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
        scene.add(display_model);

        progress.style.display = 'none';
        loadInfo.style.display = 'none';
    }, (xhr) => {
        let roundedload = Math.round(`${xhr.loaded / xhr.total * 100}`);
        loadInfo.innerHTML= `loading ${roundedload}%`;
    }, (error) => {
        console.error(error);
    });

    //

    /* controller = renderer.xr.getController( 0 );
    controller.addEventListener( 'select', onSelect );
    scene.add( controller ); */

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
                arPlaceBtn.style.display = 'none';
                arScaleSlider.style.display = 'none';
                arScaleKg.style.display = 'none';

                resetModel();
                camera.fov = 45;
                camera.updateProjectionMatrix();
                onWindowResize();
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
                reticle.visible = true;

                reticle.matrix.fromArray( hit.getPose( referenceSpace ).transform.matrix );
            } else {
                reticle.visible = false;
                arPlaceBtn.style.display = 'none';
                arScaleSlider.style.display = 'none';
                arScaleKg.style.display = 'none';
            }
        }
    }
    renderer.render( scene, camera );
}

export function userModelLoader(fileUrl) {
    progress.style.display = 'flex';
    loadInfo.style.display = 'flex';
    kgInfo.style.display = 'none';
    scene.remove(display_model);
    loader = new GLTFLoader();
    loader.load(fileUrl, (gltf) => {
        display_model = gltf.scene;

        /* let model = display_model;
        let bbox = new THREE.Box3().setFromObject(model);
        let center = bbox.getCenter(new THREE.Vector3());
        let size = bbox.getSize(new THREE.Vector3());

        let maxAxis = Math.max(size.x, size.y, size.z);
        model.scale.multiplyScalar(2 / maxAxis);
        bbox.setFromObject(model);
        bbox.getCenter(center);
        bbox.getSize(size);

        model.position.copy(center).multiplyScalar(-1); 
        display_model.position.y = 0; */

        display_model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });

        URL.revokeObjectURL(fileUrl);

        modelSlider.value = 1;
        modelSlider.defaultValue = modelSlider.value;
        xAxisSlider.value = xAxisSlider.defaultValue;
        yAxisSlider.value = yAxisSlider.defaultValue;

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
    kgInfo.style.display = 'flex';
    carinfo.style.display = 'block';
    carinfo.innerHTML = carInfoText;
    document.body.style.background = bgColor;
    carinfo.style.color = textColor;
    carinfo.style.borderColor = textColor;
    header.style.color = textColor;
    modelSlider.value = baseScale;
    modelSlider.defaultValue = modelSlider.value;
    /* modelSlider.max = maxScale;
    modelSlider.min = minScale; */
    xAxisSlider.value = xAxisSlider.defaultValue;
    yAxisSlider.value = yAxisSlider.defaultValue;
    let displayKG = Math.round(533 * `${baseScale}`);
    modelKg.innerHTML = `${displayKG} KG`;
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
