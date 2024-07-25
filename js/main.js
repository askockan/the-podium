import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { ARButton } from 'three/addons/webxr/ARButton.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const modelSlider = document.getElementById('model-slider');
const modelKg = document.getElementById('modelkg');
const navbutton = document.getElementById('navbutton');
const navcss = window.getComputedStyle(navbutton, null);
const sidenav = document.getElementById('sidenav');
const carinfo = document.getElementById('carinfo');


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
        let navRotation = navcss.getPropertyValue("rotate");
        let navTransform = navcss.getPropertyValue("transform");

        if (navTransform == 'matrix(1, 0, 0, 1, 0, 0)') {
            navbutton.style.marginLeft = '215px';
            sidenav.style.marginLeft = '0';
            navbutton.style.transform = 'scaleY(-1)';
        } else {
            sidenav.style.marginLeft = '-215px';
            navbutton.style.marginLeft = '7px';
            navbutton.style.rotate = '90deg';
            navbutton.style.transform = 'scaleY(1)';
        }
    })
    
    //
    
    modelSlider.addEventListener('input', (e) => {
        const scale = e.target.value;
        if (display_model) {
            display_model.scale.set(scale, scale, scale);
            ambientLight.intensity = scale*11;
            let currentKg = 533*scale
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

    rb19.addEventListener("click", () => {
        scene.remove(display_model);
        document.getElementById('progress').style.display = 'flex';
        console.log("rb19 click");
        loader = new GLTFLoader().setPath('models/rb19/');
        loader.load('scene.gltf', (gltf) => {
        console.log('loading model');
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
        console.log(base_scale);
        scene.add(display_model);

        carinfo.innerHTML = "Oracle Red Bull F1 RB19"
        document.getElementById('progress').style.display = 'none';
    }, (xhr) => {
        console.log(`loading ${xhr.loaded / xhr.total * 100}%`);
    }, (error) => {
        console.error(error);
    });
    })

    sf23.addEventListener("click", () => {
        scene.remove(display_model);
        document.getElementById('progress').style.display = 'flex';
        console.log("rb19 click");
        loader = new GLTFLoader().setPath('models/sf23/');
        loader.load('scene.gltf', (gltf) => {
        console.log('loading model');
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
        console.log(base_scale);
        scene.add(display_model);

        carinfo.innerHTML = "Scuderia Ferrari F1 SF23"
        document.getElementById('progress').style.display = 'none';
    }, (xhr) => {
        console.log(`loading ${xhr.loaded / xhr.total * 100}%`);
    }, (error) => {
        console.error(error);
    });
    })


    //default
    loader = new GLTFLoader().setPath('models/sf23/');
    loader.load('scene.gltf', (gltf) => {
        console.log('loading model');
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
        console.log(base_scale);
        scene.add(display_model);

        document.getElementById('progress').style.display = 'none';
    }, (xhr) => {
        console.log(`loading ${xhr.loaded / xhr.total * 100}%`);
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