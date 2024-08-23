var Vector2 = (typeof (Vector2) != "undefined") ? Vector2 : require("./Vector2");

var Hitbox2 = class {
    constructor(min, max) {
        this.min = new Vector2(min);
        this.max = new Vector2(max);

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
    }

    copy() {
        return new this.constructor(this.min, this.max);
    }

    intersects(h2) {
        if (this.min.x >= h2.max.x || this.max.x <= h2.min.x) {
            return false;
        }
        if (this.min.y >= h2.max.y || this.max.y <= h2.min.y) {
            return false;
        }
        return true;
    }

    containsPoint(v) {
        if (v.x >= this.min.x && v.x <= this.max.x && v.y >= this.min.y && v.y <= this.max.y) {
            return true;
        }
        return false;
    }

    contains(h2) {
        if (this.min.x >= h2.min.x && this.min.y >= h2.min.y && this.max.x <= h2.max.x && this.max.y <= h2.max.y) {
            return true;
        }
        return false;
    }

    getRadius() {
        return this.min.distance(this.max) * 0.5;
    }

    getCenter() {
        return this.min.lerp(this.max, 0.5);
    }

    getRadiusSquared() {
        return this.min.distanceSquared(this.max) * 0.25;
    }

    toJSON(){
        return {
            min: this.min.toJSON(),
            max: this.max.toJSON()
        }
    }
    
    static fromVectors(vectors){
        var min = new Vector2(-Infinity, -Infinity, -Infinity);
        var max = new Vector2(Infinity, Infinity, Infinity);
        for(var v of vectors){
            min.x = Math.min(min.x, v.x);
            min.y = Math.min(min.y, v.y);
            max.x = Math.max(max.x, v.x);
            max.y = Math.max(max.y, v.y);
        }
        return new this(min, max);
    }

    static fromJSON(jsondata){
        return new this(Vector2.fromJSON(jsondata.min), Vector2.fromJSON(jsondata.max));
    }
}


if (typeof (module) != "undefined") {
    module.exports = Hitbox2;
}