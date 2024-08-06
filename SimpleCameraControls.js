var SimpleCameraControls = class {
    constructor(options) {
        this.speed = options?.speed ?? 1;
        this.movement = { "forward": false, "backward": false, "left": false, "right": false, "up": false, "down": false, "zoom-in": false, "zoom-out": false };
        this.camera = options?.camera;
        this.pullbackRate = options?.pullbackRate ?? 0.5;
    }
    up() {
        this.movement.up = true;
    }
    down() {
        this.movement.down = true;
    }
    left() {
        this.movement.left = true;
    }
    right() {
        this.movement.right = true;
    }
    forward() {
        this.movement.forward = true;
    }
    backward() {
        this.movement.backward = true;
    }

    zoomIn() {
        this.movement["zoom-in"] = true;
    }

    zoomOut() {
        this.movement["zoom-out"] = true;
    }

    reset() {
        this.movement = { "forward": false, "backward": false, "left": false, "right": false, "up": false, "down": false, "zoom-in": false, "zoom-out": false };
    }

    getDelta() {
        var direction = this.camera.camera.getWorldDirection((new THREE.Vector3()));
        direction.y = 0;
        direction = direction.normalize()
        var delta = new THREE.Vector3(0, 0, 0);
        if (this.movement.forward) {
            delta.add(direction);
        }
        if (this.movement.backward) {
            delta.add(direction.clone().multiplyScalar(-1));
        }
        if (this.movement.left) {
            delta.add(new THREE.Vector3(direction.z, 0, -direction.x));
        }
        if (this.movement.right) {
            delta.add(new THREE.Vector3(-direction.z, 0, direction.x));
        }
        if (this.movement.up) {
            delta.add(new THREE.Vector3(0, 1, 0));
        }
        if (this.movement.down) {
            delta.add(new THREE.Vector3(0, -1, 0));
        }
        if(this.movement["zoom-in"]) {
            this.camera.zoom(-this.pullbackRate);
        }
        if(this.movement["zoom-out"]) {
            this.camera.zoom(this.pullbackRate);
        }

        delta.normalize();
        delta.multiplyScalar(this.speed);
        this.reset();
        return Vector3.from(delta);
    }
}