var Vector3 = (typeof (Vector3) != "undefined") ? Vector3 : require("./Vector3");


var Quaternion = class {
    constructor(w = 1, x = 0, y = 0, z = 0) {
        this.w = w;
        this.x = x;
        this.y = y;
        this.z = z;
    }

    multiply(q) {
        var w = this.w * q.w - this.x * q.x - this.y * q.y - this.z * q.z;
        var x = this.w * q.x + this.x * q.w + this.y * q.z - this.z * q.y;
        var y = this.w * q.y + this.y * q.w + this.z * q.x - this.x * q.z;
        var z = this.w * q.z + this.z * q.w + this.x * q.y - this.y * q.x;
        return new this.constructor(w, x, y, z);
    }

    multiplyInPlace(q) {
        var oldW = this.w;
        var oldX = this.x;
        var oldY = this.y;
        var oldZ = this.z;
        this.w = oldW * q.w - oldX * q.x - oldY * q.y - oldZ * q.z;
        this.x = oldW * q.x + oldX * q.w + oldY * q.z - oldZ * q.y;
        this.y = oldW * q.y + oldY * q.w + oldZ * q.x - oldX * q.z;
        this.z = oldW * q.z + oldZ * q.w + oldX * q.y - oldY * q.x;
        return this;
    }

    multiplyVector3(v) {
        var q = new this.constructor(0, v.x, v.y, v.z);
        var finalQ = this.multiply(q).multiply(this.conjugate());
        return new Vector3(finalQ.x, finalQ.y, finalQ.z);
    }

    conjugate() {
        return new this.constructor(this.w, -this.x, -this.y, -this.z);
    }

    conjugateInPlace() {
        this.x = -this.x;
        this.y = -this.y;
        this.z = -this.z;
        return this;
    }

    copy() {
        return new this.constructor(this);
    }

    normalize() {
        var length = this.magnitude();
        if (length == 0) {
            return this;
        }
        return this.scale(1 / length);
    }

    normalizeInPlace() {
        var length = this.magnitude();
        if (length == 0) {
            return this;
        }
        return this.scaleInPlace(1 / length);
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    }

    scale(s) {
        return new this.constructor(this.w * s, this.x * s, this.y * s, this.z * s);
    }

    scaleInPlace(s) {
        this.x *= s;
        this.y *= s;
        this.z *= s;
        this.w *= s;
        return this;
    }

    copy(){
        return new this.constructor(this.w, this.x, this.y, this.z);
    }

    set(q){
        this.w = q.w;
        this.x = q.x;
        this.y = q.y;
        this.z = q.z;
        return this;
    }

    reset() {
        this.w = 1;
        this.x = 0;
        this.y = 0;
        this.z = 0;
        return this;
    }

    static from(w = 1, x = 0, y = 0, z = 0) {
        return new this(w?.w ?? w[0] ?? w ?? 1,
                        w?.x ?? w[1] ?? x ?? 0,
                        w?.y ?? w[2] ?? y ?? 0,
                        w?.z ?? w[3] ?? z ?? 0);
    }
}


if (typeof (module) != "undefined") {
    module.exports = Quaternion;
}