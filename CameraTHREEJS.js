var CameraTHREEJS = class {
    constructor(options) {

        this.looking = { "xz": 0, "y": 0 };
        this.maxLookY = options?.maxLookY ?? Math.PI / 2;
        this.maxPullback = options?.maxPullback ?? 50;
        this.minPullback = options?.minPullback ?? 0;
        this.pullback = this.setPullback(options?.pullback ?? 0);
        this.camera = options?.camera;
    }
    
    rotateX(angle) {
        this.looking.xz += angle;
        return this.looking.xz;
    }

    rotateY(angle) {
        if (this.looking.y + angle > this.maxLookY) {
            angle = this.maxLookY - this.looking.y;
        }
        else if (this.looking.y + angle < -this.maxLookY) {
            angle = -this.maxLookY - this.looking.y;
        }
        else {
            this.looking.y += angle;
        }
        return this.looking.y;
    }

    zoom(delta) {
        if (this.pullback + delta > this.maxPullback) {
            this.pullback = this.maxPullback;
        }
        else if (this.pullback + delta < this.minPullback) {
            this.pullback = this.minPullback;
        }
        else {
            this.pullback += delta;
        }
        return this.pullback;
    }

    setPullback(pullback) {
        this.pullback = pullback;
        if(this.pullback < this.minPullback) {
            this.pullback = this.minPullback;
        }
        if(this.pullback > this.maxPullback) {
            this.pullback = this.maxPullback;
        }
        return this.pullback;
    }

    getLookAt() {
        return new Vector3(Math.cos(this.looking.y) * Math.cos(this.looking.xz), Math.sin(this.looking.y), Math.cos(this.looking.y) * Math.sin(this.looking.xz));
    }

    update(entity) {
        var normalizedLookAt = this.getLookAt().normalize();

        this.camera.lookAt(camera.position.clone().add(normalizedLookAt));
        this.camera.position.x = entity.position.x;
        this.camera.position.y = entity.position.y;
        this.camera.position.z = entity.position.z;
        this.camera.position.add(normalizedLookAt.scale(-this.pullback));
    }
}