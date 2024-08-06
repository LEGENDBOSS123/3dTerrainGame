

noise.seed(Math.random());

var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

var stats = new Stats();
stats.showPanel(0);
document.body.appendChild(stats.dom);

var scene = new THREE.Scene();
scene.background = new THREE.Color(0x8CBED6);

var camera = new THREE.PerspectiveCamera(80, window.innerWidth / window.innerHeight, 0.1, 15000);
scene.add(camera);


var raycaster = new THREE.Raycaster();
raycaster.far = 1000;
raycaster.near = 0.1;
raycaster.precision = 0.01;
var mouse = new THREE.Vector2();


var world = new World();
world.setIterations(4);
var player = new Point({ global: { body: { acceleration: new Vector3(0, -0.5, 0), position: new Vector3(0, 1500, 0) } }, local: { body: { mass: 10 } } });
player.setMesh({ radius: 5, material: new THREE.MeshPhongMaterial({ color: 0x00ff00, wireframe: false }) });

player.addToScene(scene);
world.addComposite(player);

// var playerPart = new Point();
// playerPart.setMesh({ radius: 5, material: new THREE.MeshPhongMaterial({ color: 0x00ff00, wireframe: false }) });
// playerPart.addToScene(scene);
// playerPart.local.body.mass = 100;
// playerPart.local.body.position.x += 0;
// playerPart.local.body.setVelocity(new Vector3(0, 0, 0));
// player.add(playerPart);
// world.addComposite(playerPart);


var addToPlayer = function(pos, mass = 10){

    var playerPart = new Point();
    playerPart.setMesh({ radius: 5, material: new THREE.MeshPhongMaterial({ color: 0x00ff00, wireframe: false }) });
    playerPart.addToScene(scene);
    playerPart.local.body.mass = mass;
    playerPart.local.body.position.x += pos.x;
    playerPart.local.body.position.y += pos.y;
    playerPart.local.body.position.z += pos.z;
    playerPart.local.body.setVelocity(new Vector3(0, 0, 0));
    player.add(playerPart);
    world.addComposite(playerPart);
}

for(var i = 0; i < 30; i++){
    addToPlayer(new Vector3(Math.random() * 100 - 50, Math.random() * 100 - 50, Math.random() * 100 - 50));

}


player.setLocalFlag(Composite.FLAGS.CENTER_OF_MASS, true);

// var ball = new Point({global:{body:{acceleration: new Vector3(0, -0.2, 0), position:new Vector3(0,100,0)}}});
// ball.setMesh({ radius: 5, material: new THREE.MeshPhongMaterial({ color: 0x00ff00, wireframe: false }) });
// ball.local.body.mass = 1;
// ball.addToScene(scene);
// world.addComposite(ball);

var skybox = new THREE.SphereGeometry(10000, 64, 64);
var skyboxMaterial = new THREE.MeshBasicMaterial({ color: 0x8CBED6, side: THREE.BackSide });
var skyboxMesh = null;

var loader = new THREE.TextureLoader();

loader.load("autumn_field_puresky.jpg", function (txt) {
    skyboxMaterial = new THREE.MeshBasicMaterial({ map: txt, side: THREE.BackSide });
    skyboxMesh = new THREE.Mesh(skybox, skyboxMaterial);
    scene.add(skyboxMesh);
    console.log("loaded");
}, null, function (e) {
    skyboxMaterial = new THREE.MeshBasicMaterial({ color: 0x8CBED6, side: THREE.BackSide });
    skyboxMesh = new THREE.Mesh(skybox, skyboxMaterial);
    scene.add(skyboxMesh);
    console.log("failed");
});

/*
const csm = new THREE.CSM({
    maxFar: camera.far,
    cascades: 4,
    mode: 'practical',
    parent: scene,
    shadowMapSize: 2048,
    lightDirection: new THREE.Vector3(1, -1, 1).normalize(),
    camera: camera
});*/

var gameCamera = new CameraTHREEJS({ camera: camera, pullback: 100, maxPullback: 500 });
var cameraControls = new SimpleCameraControls({ camera: gameCamera, speed: 0.05, pullbackRate: 4 });
var keyListener = new Keysheld(window);


var generate2dHeightmap = function (xDim, zDim) {
    var map = [];
    for (var x = 0; x < xDim; x++) {
        var row = [];
        for (var z = 0; z < zDim; z++) {
            var x1 = (x-xDim/2)/10;
            var z1 = (z-zDim/2)/10;
            row.push(Math.sin(x1)*75);
        }
        map.push(row);
    }
    //return map;

    var map = [];
    for (var x = 0; x < xDim; x++) {
        var row = [];
        for (var z = 0; z < zDim; z++) {
            row.push(noise.perlin2(x / 10, z / 10) * 120 + noise.perlin2(x / 10, z / 10) * Math.sin(x/10) * 75 
            + (noise.perlin2(x / 10, z / 10)+1) * Math.sin((noise.simplex2(x + z, z - x))/100)**4 * 340);
        }
        map.push(row);
    }
    return map;
}




var topArray = generate2dHeightmap(200, 200);

var topArray2 = generate2dHeightmap(200,200);

var ambientLight = new THREE.AmbientLight(0xbbbbbb);
scene.add(ambientLight);

var light = new THREE.DirectionalLight(0xffffff, 3);

scene.add(light);







var terrain1 = Terrain3.from2dArrays(topArray, topArray);
var extension = Math.random() < 0.5 ? ".png" : ".jpg";
var dim = extension == ".jpg" ? 512 : 1536;
var topArray = generate2dHeightmap(dim, dim);

var terrain1 = Terrain3.fromDimensions(dim,dim);

terrain1.setTerrainScale(40);


var terrain1Material = new THREE.MeshPhongMaterial({ color: 0xFFFF00, vertexColors: false });
terrain1Material.wireframe = false;
terrain1.setMaps(topArray.flat(), topArray.flat());
terrain1.balance();

var img = new Image();
img.src = "h" + extension;

img.onload = function () {
    var arr = Terrain3.getArrayFromImage(img, dim == 512 ? 12 : 48);
    var terr = Terrain3.from2dArrays(arr, arr);
    terrain1.setMaps(terr.heightmaps.top.map, terr.heightmaps.bottom.map);
    terrain1.balance();
    if(terrain1.mesh){
        terrain1.calculateMeshVertices(terrain1.mesh.children[0].geometry, terrain1.heightmaps.top);
    }
}

loader.load("c" + extension, function (txt) {
    terrain1Material = new THREE.MeshPhongMaterial({ map: txt, vertexColors: true });
    terrain1.setMesh(terrain1Material);
    terrain1.addToScene(scene);
    terrain1.mesh.receiveShadow = true;
    terrain1.mesh.castShadow = true;
}, null, function (e) {
    terrain1.setMesh(terrain1Material);
    terrain1.addToScene(scene);
    terrain1.mesh.receiveShadow = true;
    terrain1.mesh.castShadow = true;
});
terrain1.addToScene(scene);
terrain1.setMesh(terrain1Material);
    terrain1.mesh.receiveShadow = true;
    terrain1.mesh.castShadow = true;
terrain1.local.body.setPosition(new Vector3(-290, 0, 0));
var terrain2 = Terrain3.from2dArrays(topArray2, topArray2);
terrain2.setTerrainScale(30);
var terrain2Material = new THREE.MeshPhongMaterial({ color: 0x00FFFF });
terrain2Material.wireframe = false;
terrain2.setMesh(terrain2Material);
terrain2.addToScene(scene);
terrain2.global.body.setPosition(new Vector3(0, 0, 0));
terrain2.add(terrain1);
world.addComposite(terrain2);

world.addComposite(terrain1);

player.global.body.setVelocity(new Vector3());


const axesHelper = new THREE.AxesHelper(100);
scene.add(axesHelper);

terrain2.mesh.receiveShadow = true;
terrain2.mesh.castShadow = true;


window.addEventListener('wheel', function (e) {
    if (!camera) {
        return;
    }
    gameCamera.rotateY(e.deltaY / 100);
    gameCamera.rotateX(-e.deltaX / 100);
});

window.addEventListener('mousemove', function (e) {
    if (!camera) {
        return;
    }
    mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    //gameCamera.rotateX(e.movementX / 100);
    //gameCamera.rotateY(e.movementY / 100);
});




function render() {
    stats.begin();
    /*raycaster.setFromCamera(mouse, camera);
    var intersects = raycaster.intersectObjects(scene.children);
    if (intersects.length > 0) {
        var object = intersects[0];
        if (terrain1.mesh && object.object == terrain1.mesh.children[0]) {
            top.attrib = terrain1.mesh.children[0].geometry.attributes;

        }
    }*/

    if (keyListener.isHeld("ArrowUp") || keyListener.isHeld("KeyW")) {
        cameraControls.forward();
    }
    if (keyListener.isHeld("ArrowDown") || keyListener.isHeld("KeyS")) {
        cameraControls.backward();
    }
    if (keyListener.isHeld("ArrowLeft") || keyListener.isHeld("KeyA")) {
        cameraControls.left();
    }
    if (keyListener.isHeld("ArrowRight") || keyListener.isHeld("KeyD")) {
        cameraControls.right();
    }
    if (keyListener.isHeld("Space")) {
        cameraControls.up();
    }
    if (keyListener.isHeld("ShiftLeft") || keyListener.isHeld("ShiftRight")) {
        cameraControls.down();
    }
    if (keyListener.isHeld("KeyO")) {
        cameraControls.zoomOut();
    }
    if (keyListener.isHeld("KeyI")) {
        cameraControls.zoomIn();
    }
    world.step()
    var grounded = false;

    if (!grounded) {
        cameraControls.movement.up = false;
    }
    else {
        if(cameraControls.movement.up){
            var vel = player.global.body.getVelocity();
            player.global.body.setVelocity(new Vector3(vel.x, vel.y + 10, vel.z));
        }
    }
    
    var delta = cameraControls.getDelta(camera).scale(10 * player.global.body.mass * world.deltaTime);
    //player.global.body.position.addInPlace(delta.scale(world.deltaTime));
    player.applyForce(delta, player.global.body.position);
    var vel = player.global.body.getVelocity();
    var ogvel = vel.copy();
    
    vel.scaleInPlace(0.95);
    vel.y = ogvel.y;
    //player.global.body.setVelocity(vel);
   
    
    gameCamera.update(player.global.body);
    if (skyboxMesh) {
        skyboxMesh.position.copy(camera.position);
    }
    renderer.render(scene, camera);

    stats.end();
    requestAnimationFrame(render);
}

render();