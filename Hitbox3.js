var Vector3 = (typeof (Vector3) != "undefined") ? Vector3 : require("./Vector3");

var Hitbox3 = class {
    constructor(min, max) {
        this.min = Vector3.from(min);
        this.max = Vector3.from(max);
    }

    copy() {
        return new this.constructor(this.min, this.max);
    }

    reorder(){
        var temp = 0;
        if (this.min.x > this.max.x) {
            temp = this.min.x;
            this.min.x = this.max.x;
            this.max.x = temp;
        }
        if (this.min.y > this.max.y) {
            temp = this.min.y;
            this.min.y = this.max.y;
            this.max.y = temp;
        }
        if (this.min.z > this.max.z) {
            temp = this.min.z;
            this.min.z = this.max.z;
            this.max.z = temp;
        }
        return this;
    }
    
    intersects(h2) {
        if (this.min.x >= h2.max.x || this.max.x <= h2.min.x) {
            return false;
        }
        if (this.min.y >= h2.max.y || this.max.y <= h2.min.y) {
            return false;
        }
        if (this.min.z >= h2.max.z || this.max.z <= h2.min.z) {
            return false;
        }
        return true;
    }

    containsPoint(v) {
        if (v.x >= this.min.x && v.x <= this.max.x && v.y >= this.min.y && v.y <= this.max.y && v.z >= this.min.z && v.z <= this.max.z) {
            return true;
        }
        return false;
    }

    contains(h2) {
        if (this.min.x >= h2.min.x && this.min.y >= h2.min.y && this.max.x <= h2.max.x && this.max.y <= h2.max.y && this.min.z >= h2.min.z && this.max.z <= h2.max.z) {
            return true;
        }
        return false;
    }

    getRadius() {
        return this.min.distance(this.max) * 0.5;
    }

    getCenter() {
        return this.min.add(this.max).scale(0.5);
    }

    getRadiusSquared() {
        return this.min.distanceSquared(this.max) * 0.25;
    }

    toJSON() {
        return {
            min: this.min.toJSON(),
            max: this.max.toJSON()
        }
    }

    static fromVectors(vectors){
        var min = new Vector3(-Infinity, -Infinity, -Infinity);
        var max = new Vector3(Infinity, Infinity, Infinity);
        for(var v of vectors){
            min.x = Math.min(min.x, v.x);
            min.y = Math.min(min.y, v.y);
            min.z = Math.min(min.z, v.z);
            max.x = Math.max(max.x, v.x);
            max.y = Math.max(max.y, v.y);
            max.z = Math.max(max.z, v.y);
        }
        return new this(min, max);
    }

    static fromJSON(jsondata) {
        return new this(Vector3.fromJSON(jsondata.min), Vector3.fromJSON(jsondata.max));
    }
}


if (typeof (module) != "undefined") {
    module.exports = Hitbox3;
}