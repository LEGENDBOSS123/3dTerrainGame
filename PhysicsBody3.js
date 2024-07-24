var Vector3 = (typeof (Vector3) != "undefined") ? Vector3 : require("./Vector3");
var Quaternion = (typeof (Quaternion) != "undefined") ? Quaternion : require("./Quaternion");

var PhysicsBody3 = class {
    constructor(options) {
        this.mass = options?.mass ?? 1;
        this.inverseMass = options?.inverseMass ?? 1 / this.mass;
        this.position = Vector3.from(options?.position);
        this.previousPosition = Vector3.from(options?.previousPosition ?? this.position);
        this.acceleration = Vector3.from(options?.acceleration);
        this.netForce = Vector3.from(options?.netForce);

        this.rotation = Quaternion.from(options?.rotation);
        this.angularVelocity = Vector3.from(options?.angularVelocity);
        this.angularAcceleration = Vector3.from(options?.angularAcceleration);
        this.netTorque = Vector3.from(options?.netTorque);
    }

    setPosition(position) {
        var velocity = this.getVelocity();
        this.position = position.copy();
        this.setVelocity(velocity);
    }

    getVelocity() {
        return this.position.subtract(this.previousPosition);
    }

    getAngularVelocity() {
        return this.angularVelocity;
    }

    setVelocity(velocity) {
        this.previousPosition = this.position.copy();
        this.previousPosition.subtractInPlace(velocity);
    }

    setMass(mass) {
        this.mass = mass;
        this.inverseMass = 1 / mass;
        if (mass == 0) {
            this.inverseMass = 0;
        }
    }

    setAngularVelocity(angularVelocity) {
        this.angularVelocity = angularVelocity.copy();
    }

    updatePosition(deltaTime, velocity = this.getVelocity()) {
        this.position.addInPlace(velocity);
        this.position.addInPlace(this.acceleration.scale(deltaTime * deltaTime));
        this.position.addInPlace(this.netForce.scale(this.inverseMass * deltaTime * deltaTime));
    }

    updateRotation(deltaTime = 0) {
        this.angularVelocity.addInPlace(this.angularAcceleration.scale(deltaTime * deltaTime));
        this.angularVelocity.addInPlace(this.netTorque.scale(this.inverseMass * deltaTime * deltaTime));

        var angularVelocityQuaternion = new Quaternion(1, this.angularVelocity.x * 0.5, this.angularVelocity.y * 0.5, this.angularVelocity.z * 0.5);

        this.rotation = angularVelocityQuaternion.multiply(this.rotation).normalizeInPlace();
    }

    update(timeDelta = 0) {
        var velocity = this.getVelocity();

        this.previousPosition = this.position.copy();

        this.updatePosition(timeDelta, velocity);
        this.netForce.reset();

        this.updateRotation(timeDelta);
        this.netTorque.reset();
    }
}


if (typeof (module) != "undefined") {
    module.exports = PhysicsBody3;
}