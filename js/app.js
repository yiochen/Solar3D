var scene;
var camera;
var stats;
var renderer;
var controls;
var projector;
var sun;
var particle;
var beastmode = false;
var pressDistance = 0;
var keyboard = new KeyboardState();
var counter = 0;
var CONST = {
    minRadius: 2,
    maxRadius: 5,
    minDistance: 50,
    maxDistance: 100,
    minVel: 3,
    maxVel: 6,
    primaryColor: 0x600A7F,
    primaryColor2: 0x284BD7,
    accentColor: 0xff98cb,
    boxSize: 10000,
    accel: 0.5,
    velDeg: 1,
};
var stars = [];
window.onload = init;

function init() {
    scene = new THREE.Scene();
    //view_angle, ratio(width/height), near, far
    camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 20000);
    scene.add(camera);
    camera.position.set(0, 300, 100);
    camera.lookAt(scene.position);
    projector = new THREE.Projector();
    renderer = new THREE.WebGLRenderer({
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 1.0);
    renderer.shadowMap.enabled = true;
    //    controls = new THREE.OrbitControls(camera, renderer.domElement);
    //    controls.maxPolarAngle = Math.PI / 2;
    //    controls.maxDistance = CONST.boxSize / 2;
    createObjects();

    //create_geometry();
    create_stats();
    document.body.appendChild(renderer.domElement);


    document.addEventListener('mousedown', onDocumentMouseDown, false);
    document.addEventListener('mouseup', onDocumentMouseUp, false);
    //document.addEventListener('mousemove', onDocumentMouseMove, false);
    render();
}

function create_stats() {
    stats = new Stats();
    stats.setMode(0);
    stats.domElement.style.position = "absolute";
    stats.domElement.style.left = "0";
    stats.domElement.style.top = "0";
    document.body.appendChild(stats.domElement);


}

function rndBtw(x, y) {
    return Math.random() * (y - x) + x;
}

function createRandomStar() {
    var radius, distance;
    var star = new Star({
        type: ANTIMATTER,
        radius: radius = rndBtw(CONST.minRadius, CONST.maxRadius),
        distance: distance = rndBtw(CONST.minDistance, CONST.maxDistance),
        angle: Math.random() * Math.PI * 2,
        angularVel: rndBtw(CONST.minVel, CONST.maxVel) / distance / radius,
    });

    star.addTo(scene);
    stars.push(star);
    return star;
}

function createObjects() {
    createSky();
    createFloor();
    createSun();
    for (var i = 0; i < 10; i++) {
        createRandomStar().func.push(revolve);
    }
    createPlayer();
    createLight();
    createFog();
}

function createPlayer() {
    var star = new Star({
        type: NEUTRAL,
        radius: 10,
        distance: CONST.maxDistance + 20,
        angle: 0,
        angularVel: 0,
    });
    star.addTo(scene);
    stars.push(star);
    star.func.push(follow, revolve, shoot);
    return star;
}

function createFog() {
    var fog = new THREE.FogExp2(CONST.primaryColor, 0.001);
    scene.fog = fog;
}

function createLight() {
    var hemiLight = new THREE.HemisphereLight(0xFFFFFF, 0xFFFFFF, 1);
    scene.add(hemiLight);
    var sunLight = new THREE.PointLight(CONST.accentColor, 1, 1000);
    scene.add(sunLight);
    //var dirLight = new THREE.DirectionalLight(CONST.primaryColor, 0.5);
    //dirLight.position.set(0, 1, 0);
    //scene.add(dirLight);

    //var dirLight2 = new THREE.DirectionalLight(CONST.primaryColor2, 0.5);
    //dirLight2.position.set(0, -1, 0);
    //scene.add(dirLight2);
    var spotLight = new THREE.SpotLight(0xffffff);
    spotLight.position.set(0, 1000, 0);
    spotLight.castShadow = true;
    spotLight.onlyShadow = true;
    spotLight.intensity = 0.5;
    //            spotLight.shadowMapWidth = 1024; // spotLight.shadowMapHeight = 1024;
    spotLight.exponent = 9.42;
    spotLight.angle = 1.234;
    scene.add(spotLight);

}

function createSky() {
    var skyboxGeo = new THREE.BoxGeometry(CONST.boxSize, CONST.boxSize, CONST.boxSize);
    var skyboxMat = new THREE.MeshBasicMaterial({
        color: CONST.primaryColor,
        side: THREE.BackSide,
    });
    var skyboxMesh = new THREE.Mesh(skyboxGeo, skyboxMat);

    scene.add(skyboxMesh);
}

function createFloor() {
    var floorGeo = new THREE.PlaneGeometry(CONST.boxSize, CONST.boxSize);
    var floorMat = new THREE.MeshPhongMaterial({
        color: CONST.primaryColor,
        side: THREE.DoubleSide
    });

    var floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = 0.5 * Math.PI;
    floor.position.y = -CONST.maxRadius - 3;
    floor.receiveShadow = true;
    scene.add(floor);

}

function addGlow() {

}

function createSun() {
    sun = new Star({
        type: NEUTRAL,
        radius: 10,
        distance: 0
    });
    sun.setMat(new THREE.MeshBasicMaterial({
        map: new THREE.ImageUtils.loadTexture('./assets/sunmap.jpg')
    }));
    //sun.prop.stall = true;
    sun.func.push(rotate, jump);
    var spriteMaterial = new THREE.SpriteMaterial({
        map: new THREE.ImageUtils.loadTexture('./assets/glow.png'),
        color: 0xFFCD00,
        transparent: false,
        blending: THREE.AdditiveBlending,
    });

    var sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(sun.radius * 4, sun.radius * 4, 1.0);
    sun.starMesh.add(sprite);
    sun.addTo(scene);
    stars.push(sun);

}


function createParticle(x, y, z) {
    var particles = new THREE.Geometry();
    var texturemap = THREE.ImageUtils.loadTexture("assets/particle.png");
    texturemap.minFilter = THREE.NearestFilter;
    var pMaterial = new THREE.PointsMaterial({
        color: 0xFFFFFF,
        size: 20,
        map: texturemap,
        blending: THREE.AdditiveBlending,
        transparent: true,
    });
    for (var p = 0; p < 800; p++) {
        var particle = new THREE.Vector3(x + Math.random() * 100 - 50, y + Math.random() * 100 - 50, z + Math.random() * 100 - 50);
        particles.vertices.push(particle);
    }
    var particleSystem = new THREE.Points(
        particles,
        pMaterial
    );
    particleSystem.sortParticles = true;
    scene.add(particleSystem);
}

function onDocumentMouseDown(event) {
    beastmode = true;
    var mouse = {};
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    //createParticle(0, 0);
    var vector = new THREE.Vector3(mouse.x, mouse.y, 1);
    vector.unproject(camera);
    var ray = new THREE.Raycaster(camera.position, vector.sub(camera.position).normalize());
    var intersects = ray.intersectObjects([sun.starMesh]);
    if (intersects.length > 0) {

        sun.speed = 5;
    }
}

function onDocumentMouseUp(event) {
    beastmode = false;
}

function collisionDetect(stars) {
    for (var i = 0; i < stars.length; i++) {
        for (var j = i + 1; j < stars.length; j++) {
            if (stars[i].dead || stars[j].dead) continue;
            var distance = stars[i].getPos().sub(stars[j].getPos()).length();
            if (distance < 0) alert("length cannot be smaller than 0");
            var amount = stars[i].getR() + stars[j].getR() - distance;
            //            if (stars[i].type == stars[j].type && stars[i].type != NEUTRAL) {
            if ((stars[i].mask & stars[j].attribute) > 0 && (stars[i].attribute == stars[j].attribute)) {
                if (amount > 0) absorb(stars[i], stars[j], amount / 2);
            }
            if ((stars[i].mask & stars[j].attribute) > 0 && (stars[i].attribute != stars[j].attribute)) {
                if (amount > 0) cancel(stars[i], stars[j], amount / 2);
            }
            //            if (stars[i].type != stars[j].type && stars[i].type != NEUTRAL && stars[j].type != NEUTRAL) {
            //                if (amount > 0) cancel(stars[i], stars[j], amount / 2);
            //            }
        }
    }
    var len = stars.length;
    for (var i = len - 1; i >= 0; i--) {
        if (stars[i].dead) {
            scene.remove(stars[i]);
            stars.splice(i, 1);
        }
    }
}



function render() {
    counter++;
    stats.update();
    keyboard.update();
    if (keyboard.pressed("left")) {

        pressDistance += 1;
    }

    if (keyboard.pressed("right")) pressDistance -= 1;
    //controls.update();
    collisionDetect(stars);
    for (var star of stars)
        if (!star.static) updateStar(star);
    requestAnimationFrame(render);
    renderer.render(scene, camera);
}