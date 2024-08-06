var Vector3  = (typeof (Vector3) != "undefined") ? Vector3 : require("./Vector3");
var Composite = (typeof (Composite) != "undefined") ? Composite : require("./Composite");


var Sphere = class extends Composite {
    constructor(options) {
        super(options);
        this.shape = this.constructor.SHAPES.SPHERE;
        this.radius = options?.radius ?? 1;
        this.setLocalFlag(this.constructor.FLAGS.OCCUPIES_SPACE, true);
        this.calculateLocalHitbox();
        this.calculateGlobalHitbox();
    }

    calculateLocalHitbox() {
        this.local.hitbox.min = new Vector3(-this.radius, -this.radius, -this.radius);
        this.local.hitbox.max = new Vector3(this.radius, this.radius, this.radius);
        return this.hitbox;
    }

    calculateGlobalHitbox() {
        this.global.hitbox.min = this.local.hitbox.min.add(this.global.body.position);
        this.global.hitbox.max = this.local.hitbox.max.add(this.global.body.position);
        return this.global.hitbox;
    }

    calculateLocalMomentOfInertia() {
        this.local.body.momentOfInertia = Matrix3.zero();
        var I = (2/5) * this.local.body.mass * this.radius * this.radius;
        this.local.body.momentOfInertia.set(I, 0, 0);
        this.local.body.momentOfInertia.set(I, 1, 1);
        this.local.body.momentOfInertia.set(I, 2, 2);
        return this.local.body.momentOfInertia;
    }

    rotateLocalMomentOfInertia(quaternion) {
        return this.local.body.momentOfInertia;
    }

    setMesh(options){
        var geometry = options?.geometry ?? new THREE.SphereGeometry(this.radius, 16, 16);
        this.mesh = new THREE.Mesh(geometry, options?.material ?? new THREE.MeshPhongMaterial({ color: 0x00ff00, wireframe: true }));
    }
};


if (typeof (module) != "undefined") {
    module.exports = Sphere;
}