var Vector3  = (typeof (Vector3) != "undefined") ? Vector3 : require("./Vector3");
var Composite = (typeof (Composite) != "undefined") ? Composite : require("./Composite");


var Sphere = class extends Composite {
    constructor(options) {
        super(options);
        this.shape = this.constructor.SHAPES.SPHERE;
        this.radius = options?.radius ?? 1;
    }

    setMesh(options){
        var geometry = options?.geometry ?? new THREE.SphereGeometry(this.radius, 16, 16);
        this.mesh = new THREE.Mesh(geometry, options?.material ?? new THREE.MeshPhongMaterial({ color: 0x00ff00, wireframe: true }));
    }
}


if (typeof (module) != "undefined") {
    module.exports = Sphere;
}