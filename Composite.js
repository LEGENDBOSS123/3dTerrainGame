var Vector3 = (typeof (Vector3) != "undefined") ? Vector3 : require("./Vector3");
var PhysicsBody3 = (typeof (PhysicsBody3) != "undefined") ? PhysicsBody3 : require("./PhysicsBody3");
var Quaternion = (typeof (Quaternion) != "undefined") ? Quaternion : require("./Quaternion");
var Hitbox3 = (typeof (Hitbox3) != "undefined") ? Hitbox3 : require("./Hitbox3");

var Composite = class {

    static FLAGS = {
        STATIC: 1 << 0,
        DYNAMIC: 1 << 1,
        KINEMATIC: 1 << 2,
        CENTER_OF_MASS: 1 << 3,
        FIXED_POSITION: 1 << 4,
        FIXED_ROTATION: 1 << 5,
        UPDATE_ONCE: 1 << 6,
        OCCUPIES_SPACE: 1 << 7
    };

    static SHAPES = {
        SPHERE: 0,
        TERRAIN3: 1,
        COMPOSITE: 2,
        POINT: 3
    }

    constructor(options) {
        this.id = options?.id ?? 0;
        this.shape = options?.shape ?? this.constructor.SHAPES.COMPOSITE;

        this.world = options?.world ?? null;
        this.parent = options?.parent ?? null;
        this.maxParent = options?.maxParents ?? this;
        this.children = options?.children ?? [];
        this.global = {};
        this.global.body = new PhysicsBody3(options?.global?.body);
        this.global.hitbox = new Hitbox3();
        this.global.flags = options?.global?.flags ?? 0;

        this.local = {};
        this.local.body = new PhysicsBody3(options?.local?.body);
        this.local.flags = options?.local?.flags ?? 0;
        this.setLocalFlag(this.constructor.FLAGS.OCCUPIES_SPACE, false);

        this.local.hitbox = new Hitbox3();
        this.mesh = options?.mesh ?? null;

    }

    calculateLocalHitbox() {
        this.local.hitbox.min = new Vector3(0, 0, 0);
        this.local.hitbox.max = new Vector3(0, 0, 0);
        return this.local.hitbox;
    }

    calculateGlobalHitbox() {
        this.global.hitbox.min = this.local.hitbox.min.add(this.global.body.position);
        this.global.hitbox.max = this.local.hitbox.max.add(this.global.body.position);
        return this.global.hitbox;
    }

    getGlobalFlag(flag) {
        return (this.global.flags & flag) != 0;
    }

    setGlobalFlag(flag, value) {
        if (value) {
            this.global.flags |= flag;
        } else {
            this.global.flags &= ~flag;
        }
    }

    toggleGlobalFlag(flag) {
        this.flags ^= flag;
    }

    setLocalFlag(flag, value) {
        if (value) {
            this.local.flags |= flag;
        } else {
            this.local.flags &= ~flag;
        }
    }

    toggleLocalFlag(flag) {
        this.local.flags ^= flag;
    }
    
    getLocalFlag(flag) {
        return (this.local.flags & flag) != 0;
    }

    translate(v){
        if(this.isMaxParent()){
            var velocity = this.global.body.getVelocity();
            this.global.body.position.addInPlace(v);
            this.global.body.setVelocity(velocity);
            return;
        }
        this.maxParent.translate(v);
    }

    setParentAll(parent) {
        this.parent = parent;
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].setParentAll(parent);
        }
    }

    add(child) {
        child.setParentAll(this);
        child.setMaxParentAll(this);
        this.children.push(child);
    }

    isMaxParent() {
        return this == this.maxParent;
    }

    setMaxParentAll(maxParent) {
        this.maxParent = maxParent;
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].setMaxParentAll(maxParent);
        }
    }
    removeSelf() {
        if (this.isMaxParent()) {
            return;
        }
        this.maxParent = this;
        this.setMaxParentAll(this);
    }

    getVelocityAtPosition(position) {
        return this.global.body.getVelocityAtPosition(position);
    }

    applyForce(force, position) {
        if (this.isMaxParent()) {
            this.global.body.netForce.addInPlace(force);
            this.global.body.netTorque.addInPlace((position.subtract(this.global.body.position)).cross(force));
            return;
        }
        this.maxParent.applyForce(force, position);
    }

    setPosition(position) {
        if (this.isMaxParent()) {
            this.global.body.setPosition(position);
            return;
        }
        this.local.body.setPosition(position);
    }

    setRotation(rotation) {
        if (this.isMaxParent()) {
            this.global.body.rotation = rotation.copy();
            return;
        }
        this.local.body.rotation = rotation.copy();
    }

    setAngularVelocity(angularVelocity) {
        if (this.isMaxParent()) {
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

        if (this.parent) {
            this.parent.global.body.mass += this.global.body.mass;
        }

        this.global.body.setMass(this.global.body.mass);
    }

    syncAll() {
        
        if (!this.isMaxParent()) {

            this.global.flags = this.parent.global.flags | this.local.flags;

            this.global.body.rotation.set(this.parent.global.body.rotation.multiply(this.local.body.rotation));
            this.global.body.position.set(this.parent.global.body.position.add(this.parent.global.body.rotation.multiplyVector3(this.local.body.position)));
            //this.global.body.setVelocity(this.parent.global.body.getVelocity().add(this.parent.global.body.rotation.multiplyVector3(this.local.body.getVelocity())));
            this.global.body.acceleration.set(this.parent.global.body.acceleration.add(this.parent.global.body.rotation.multiplyVector3(this.local.body.acceleration)));

            this.global.body.angularVelocity.set(this.parent.global.body.angularVelocity.add(this.local.body.angularVelocity));
            this.global.body.angularAcceleration.set(this.parent.global.body.angularAcceleration.add(this.local.body.angularAcceleration));
        }
        else {
            this.global.flags = this.local.flags;
        }

        for (var i = 0; i < this.children.length; i++) {
            this.children[i].syncAll();
        }

        if (this.getLocalFlag(this.constructor.FLAGS.CENTER_OF_MASS)) {
            var centerOfMass = this.getCenterOfMass();
            var translationAmount = this.global.body.rotation.conjugate().multiplyVector3(this.global.body.position.subtract(centerOfMass));
            this.translateChildren(translationAmount);
        }
    }

    updateGlobalHitboxAll() {
        this.calculateGlobalHitbox();
        if(this.world?.spatialHash && this.getLocalFlag(this.constructor.FLAGS.OCCUPIES_SPACE)) {
            this.world.spatialHash.addHitbox(this.global.hitbox, this.id);
        }
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].updateGlobalHitboxAll();
        }
    }

    updateAllMeshes() {
        this.updateMesh();
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].updateAllMeshes();
        }
    }

    setMesh(options) {
        return null;
    }

    update() {
        if (!this.isMaxParent()) {
            this.local.body.update(world);
        }
        this.global.body.update(world);
    }

    updateBeforeCollisionAll() {
        if (this.isMaxParent()) {
            this.calculatePropertiesAll();
            this.syncAll();
            
        }
        this.updateGlobalHitboxAll();
        this.update();
        for (var i = 0; i < this.children.length; i++) {
            this.children[i].updateBeforeCollisionAll();
        }
    }

    updateAfterCollisionAll(){
        if (this.isMaxParent()) {
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