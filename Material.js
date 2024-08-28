
var Material = class {
    constructor(options) {
        this.restitution = options?.restitution ?? 0;
        this.friction = options?.friction ?? 0;
    }

    copy() {
        return new Material(this);
    }

    setRestitution(restitution) {
        this.restitution = restitution;
    }

    setFriction(friction) {
        this.friction = friction;
    }

    combineRestitution(other){
        return Math.sqrt(Math.max(0, this.restitution) * Math.max(0, other.restitution));
    }

    combineFriction(other) {
        return Math.max(0, (this.friction + other.friction)/2);
    }

    getCombined(other) {
        return new Material({ restitution: this.combineRestitution(other), friction: this.combineFriction(other) });
    }
};