var Vector3 = (typeof (Vector3) != "undefined") ? Vector3 : require("./Vector3");
var PhysicsBody3 = (typeof (PhysicsBody3) != "undefined") ? PhysicsBody3 : require("./PhysicsBody3");
var Quaternion = (typeof (Quaternion) != "undefined") ? Quaternion : require("./Quaternion");

var Composite = class {

    static FLAGS = {
        STATIC: 1 << 0,
        DYNAMIC: 1 << 1,
        KINEMATIC: 1 << 2,
        CENTER_OF_MASS: 1 << 3,
        FIXED_POSITION: 1 << 4,
        FIXED_ROTATION: 1 << 5,
        UPDATE_ONCE: 1 << 6
    };

    static SHAPES = {
        SPHERE: 0,
        TERRAIN3: 1,
        COMPOSITE: 2
    }

    constructor(options) {
        this.id = options?.id ?? 0;
        this.shape = options?.shape ?? this.constructor.SHAPES.COMPOSITE;

        this.world = options?.world ?? null;
        this.parent = options?.parent ?? null;
        this.children = options?.children ?? [];
        this.global = {};
        this.global.body = new PhysicsBody3(options?.global?.body);
        this.global.flags = options?.global?.flags ?? 0;

        this.local = {};
        this.local.body = new PhysicsBody3(options?.local?.body);
        this.local.flags = options?.local?.flags ?? 0;
        this.mesh = options?.mesh ?? null;

    }

    getFlag(flag) {
        return (this.global.flags & flag) != 0;
    }

    setFlag(flag, value) {
        if (value) {
            this.global.flags |= flag;
        } else {
            this.global.flags &= ~flag;
        }
    }

    toggleFlag(flag) {
        this.flags ^= flag;
    }

    add(child) {
        child.parent = this;
        this.children.push(child);
    }

    applyForce(force, position) {
        if (this.parent) {
            this.parent.applyForce(force, position);
            return;
        }
        this.body.netForce.addInPlace(force);
        this.body.netTorque.addInPlace(this.body.rotation.multiplyVector3(force));
    }

    setPosition(position) {
        if (!this.parent) {
            this.global.body.setPosition(position);
            return;
        }
        this.local.body.setPosition(position);
    }

    setRotation(rotation) {
        if (!this.parent) {
            this.global.body.rotation = rotation.copy();
            return;
        }
        this.local.body.rotation = rotation.copy();
    }

    setAngularVelocity(angularVelocity) {
        if (!this.parent) {
            this.global.body.angularVelocity = angularVelocity.copy();
            return;
        }
        this.local.body.angularVelocity = angularVelocity.copy();
    }

    getCenterOfMass() {
        if (!this.children.length) {
            return this.global.body.position.copy();
        }
        var centerOfMass = this.global.body.position.scale(this.local.body.mass);
        for (var i = 0; i < this.children.length; i++) {
            centerOfMass.addInPlace(this.children[i].getCenterOfMass().scale(this.children[i].global.body.mass));
        }
        centerOfMass.scaleInPlace(this.global.body.inverseMass);
        return centerOfMass;
    }

    calculatePropertiesAll() {

        this.global.body.mass = this.local.body.mass;
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].calculatePropertiesAll();
        }

        if(this.parent){
            this.parent.global.body.mass += this.global.body.mass;
        }

        this.global.body.setMass(this.global.body.mass);
    }

    syncAll() {

        if (this.parent) {

            this.global.flags = this.parent.global.flags | this.local.flags;

            this.global.body.rotation.set(this.parent.global.body.rotation.multiply(this.local.body.rotation));
            this.global.body.position.set(this.parent.global.body.position.add(this.parent.global.body.rotation.multiplyVector3(this.local.body.position)));

            this.global.body.angularVelocity.set(this.parent.global.body.angularVelocity.add(this.local.body.angularVelocity));
            this.global.body.angularAcceleration.set(this.parent.global.body.angularAcceleration.add(this.local.body.angularAcceleration));
        }
        else{
            this.global.flags = this.local.flags;
        }

        for (var i = 0; i < this.children.length; i++) {
            this.children[i].syncAll();
        }

        if (this.getFlag(this.constructor.FLAGS.CENTER_OF_MASS)) {
            var translationAmount = this.global.body.rotation.conjugate().multiplyVector3(this.global.body.position.subtract(this.getCenterOfMass()));
            this.translateChildren(translationAmount);
        }
    }

    updateAllMeshes() {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].updateAllMeshes();
        }

        this.updateMesh();
    }

    setMesh(options) {
        return null;
    }

    update(deltaTime = 0) {
        this.local.body.update(deltaTime);
        this.global.body.update(deltaTime);
    }

    updateAll(deltaTime = 0) {
        if (!this.parent) {
            this.calculatePropertiesAll();
        }
        this.update(deltaTime);
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].updateAll(deltaTime);
        }
        if (!this.parent) {
            this.syncAll();
        }
        this.updateAllMeshes();
    }

    updateMesh() {
        if (this.mesh) {
            this.mesh.position.copy(this.global.body.position);
            this.mesh.quaternion.copy(this.global.body.rotation);
        }
    }

    addToScene(scene) {
        if (!this.mesh) {
            return null;
        }
        scene.add(this.mesh);
    }

    translateChildren(v) {
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].local.body.position.addInPlace(v);
            this.children[i].local.body.previousPosition.addInPlace(v);
        }
    }
}


if (typeof (module) != "undefined") {
    module.exports = Composite;
}