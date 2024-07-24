var Vector3 = (typeof (Vector3) != "undefined") ? Vector3 : require("./Vector3");

var Shape = class {
    constructor(options) {
        this.parent = options?.parent ?? null;
        this.body = options?.body ?? new PhysicsBody3();
        this.updated = options?.updated ?? false;
    }

    applyForce(force, position) {
        if(this.parent){
            this.parent.applyForce(force, position);
            return;
        }

        this.body.netForce.addInPlace(force);
    }

    getCenter() {
        return this.body.position;
    }

}