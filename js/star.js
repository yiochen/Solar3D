var Matter = {
    color: 0xFAA3E1,
}
var AntiMatter = {
    color: 0x05011F,
}
var Neutral = {
    color: 0xFFFFFF,
}
var MATTER = "matter";
var ANTIMATTER = "antimatter";
var NEUTRAL = "neutral";

function setAttr(el, attrs) {
    if (!attrs) return el;
    for (var key in attrs) {
        el[key] = attrs[key];
    }
    return el;
}

function initConfig(attrs) {
    var config = {
        type: NEUTRAL,
        emissive: 0x000033,
        radius: 5,
        distance: 10,
        angle: 0,
        angularVel: 0,
        static: false,
        dead: false,
        func: [],
    };
    return setAttr(config, attrs);
}

var Star = function (config) {
    setAttr(this, initConfig());
    setAttr(this, config);
    this.starGeo = new THREE.SphereGeometry(config.radius, 30, 30);
    if (this.type == MATTER) this.color = Matter.color;
    if (this.type == ANTIMATTER) this.color = AntiMatter.color;
    if (this.type == NEUTRAL) this.color = Neutral.color;
    this.starMat = new THREE.MeshPhongMaterial({
        color: this.color,
        emissive: this.emissive,
    });
    this.starMesh = new THREE.Mesh(this.starGeo, this.starMat);

    this.starMesh.getStar = function () {
        return this;
    };
    this.setMat = function (material) {
        this.starMesh.material = material;
    };
    this.addTo = function (scene) {
        scene.add(this.starMesh);
    };
    this.setPos = function (x, y, z) {
        if (x == null) x = this.starMesh.position.x;
        if (y == null) y = this.starMesh.position.y;
        if (z == null) z = this.starMesh.position.z;
        this.starMesh.position.set(x, y, z);
    };
    this.getPos = function () {
        return this.starMesh.position.clone();
    };
    this.getR = function () {
        return this.starMesh.geometry.parameters.radius * this.getScale();
    };
    this.getScale = function () {
        return this.starMesh.scale.x;
    }
    this.addR = function (dis) {
        var newR = this.getR() + dis;
        //console.log("changed scale from " + this.starMesh.scale.x + " radius is " + this.starMesh.geometry.parameters.radius + " and " + this.radius * this.starMesh.scale.x);
        if (newR < 0) newR = 0.01;
        var scale = newR / this.radius;
        this.starMesh.scale.set(scale, scale, scale);
    }
    revolve(this);
};

//function createStar(radius, distance, angle, angularVel) {
//
//    //    var starMesh = new THREE.Mesh(starGeo, starMat);
//    //
//    //    var prop = {
//    //        radius: radius,
//    //        distance: distance,
//    //        angle: (typeof (angle) !== 'undefined') ? angle : 0,
//    //        angularVel: (typeof (angularVel) !== 'undefined') ? angularVel : 0,
//    //        stall: false,
//    //        func: [],
//    //    };
//    //    starMesh.castShadow = true;
//    //    starMesh.prop = prop;
//    var config = initConfig({
//        "radius": radius,
//        "distance": distance,
//    });
//
//    var star = new Star()
//    stars.push(starMesh);
//    scene.add(starMesh);
//    return starMesh;
//}


function revolve(star) {
    star.angle += star.angularVel;
    var x = star.distance * Math.sin(star.angle);
    var z = star.distance * Math.cos(star.angle);
    star.setPos(x, 0, z);
}

function explode(star) {
    createParticle(star.starMesh.position.x, star.starMesh.position.y, star.starMesh.position.z);

}

function rotate(star) {
    star.starMesh.rotation.y += 0.1;
}

function updateStar(star) {
    for (var func of star.func) {
        //console.log("run " + func);
        func(star);
    }
}


//////////////////////////////////////////////////////////
//------------------------------------------------------//
//------------------------------------------------------//
//-----------------------Actions------------------------//
//------------------------------------------------------//
//------------------------------------------------------//
//////////////////////////////////////////////////////////
function jump(star) {
    if (star.speed == null) {
        return;
    } else {

        console.log("star jumping");
        var pos = star.starMesh.position.y;
        pos += star.speed;

        if (Math.abs(pos) < 0.1 && Math.abs(star.speed) < 0.1) {
            pos = 0;
            star.speed = null;
        } else {
            pos += star.speed;
            if (pos < 0 && star.speed < 0) {
                pos = 0;
                star.speed = -star.speed - CONST.velDeg;
            } else {
                star.speed -= CONST.accel;
            }


        }
        star.setPos(null, pos, null);
    }
}

function sinBounce(star) {
    star.setPos(null, 5 * Math.sin(counter / 10), null);
}

function ring(star) {
    if (star.ring) {
        //star.prop.ring.rotation.x += 0.05;
        star.ring.rotation.y += 0.05;
        //star.prop.ring.rotation.z += 0.05
    } else {
        var material = new THREE.MeshBasicMaterial({
            color: 0xffffff,
            side: THREE.DoubleSide,
        });
        var radius = star.radius * 1.5;
        var circleGeometry = new THREE.CircleGeometry(radius, 30);
        var circle = new THREE.Mesh(circleGeometry, material);
        star.add(circle);
        star.ring = circle;
    }
}

function disco(star) {
    star.starMat.emissive = new THREE.Color(Math.random() * 0xFFFFFF);
}

function follow(star) {
    star.angularVel = -pressDistance / 1500;
}

function shot(star) {
    //TODO
}

function strengthComp(star1, star2) {
    if (star1.getR() < star2.getR()) return true;
    else return false;
}

function kill(star) {
    star.radius = 0;
    scene.remove(star.starMesh);
    star.dead = true;
    console.log("kill star");
    return true;
}

function absorb(star1, star2, amount) {
    var main, side;
    if (strengthComp(star1, star2)) {
        main = star2;
        side = star1;
    } else {
        main = star1;
        side = star2;
    }
    amount = Math.abs(amount);
    main.addR(amount);
    side.addR(-amount);
    if (side.getR() <= 0.5) {
        kill(side);
    }

}

function cancel(star1, star2, amount) {
    amount = Math.abs(amount);
    star1.addR(-amount);
    star2.addR(-amount);
    if (star1.getR() <= 0.5) kill(star1);
    if (star2.getR() <= 0.5) kill(star2);
}