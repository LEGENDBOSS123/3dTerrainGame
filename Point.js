var Vector3  = (typeof (Vector3) != "undefined") ? Vector3 : require("./Vector3");
var Composite = (typeof (Composite) != "undefined") ? Composite : require("./Composite");


var Point = class extends Composite {
    constructor(options) {
        super(options);
        this.shape = this.constructor.SHAPES.POINT;
        this.setLocalFlag(this.constructor.FLAGS.OCCUPIES_SPACE, true);
        this.calculateLocalHitbox();
        this.calculateGlobalHitbox();
    }

    calculateLocalMomentOfInertia() {
        this.local.body.momentOfInertia = Matrix3.zero();
        return this.local.body.momentOfInertia;
    }

    rotateLocalMomentOfInertia(quaternion) {
        return this.local.body.momentOfInertia;
    }

    setMesh(options){
        var geometry = options?.geometry ?? new THREE.SphereGeometry(options?.radius ?? 1, 16, 16);
        this.mesh = new THREE.Mesh(geometry, options?.material ?? new THREE.MeshPhongMaterial({ color: 0x00ff00, wireframe: true }));
    }
};

if (typeof (module) != "undefined") {
    module.exports = Point;
}