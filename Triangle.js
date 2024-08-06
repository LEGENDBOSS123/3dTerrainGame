var Vector3 = (typeof (Vector3) != "undefined") ? Vector3 : require("./Vector3");

var Triangle = class {
    constructor(a = new Vector3(), b = new Vector3(), c = new Vector3()) {
        this.a = a;
        this.b = b;
        this.c = c;
    }

    getNormal() {
        var v1 = this.b.subtract(this.a);
        var v2 = this.c.subtract(this.a);
        return v1.cross(v2).normalize();
    }

    getCentroid() {
        return this.a.add(this.b).add(this.c).divideScalar(3);
    }

    getArea() {
        var v1 = this.b.subtract(this.a);
        var v2 = this.c.subtract(this.a);
        return v1.cross(v2).length() / 2;
    }

    containsPoint(v) {
        var v0 = this.c.subtract(this.a);
        var v1 = this.b.subtract(this.a);
        var v2 = v.subtract(this.a);

        var dot00 = v0.dot(v0);
        var dot01 = v0.dot(v1);
        var dot02 = v0.dot(v2);
        var dot11 = v1.dot(v1);
        var dot12 = v1.dot(v2);

        var invDenom = 1 / (dot00 * dot11 - dot01 * dot01);
        var u = (dot11 * dot02 - dot01 * dot12) * invDenom;
        var v = (dot00 * dot12 - dot01 * dot02) * invDenom;

        return (u >= 0) && (v >= 0) && (u + v < 1);
    }

    getHeight(v){
        var areaABC = Math.abs((this.a.x * (this.b.z - this.c.z) + this.b.x * (this.c.z - this.a.z) + this.c.x * (this.a.z - this.b.z)) / 2.0);
        var areaPBC = Math.abs((v.x * (this.b.z - this.c.z) + this.b.x * (this.c.z - v.z) + this.c.x * (v.z - this.b.z)) / 2.0);
        var areaPCA = Math.abs((this.a.x * (v.z - this.c.z) + v.x * (this.c.z - this.a.z) + this.c.x * (this.a.z - v.z)) / 2.0);
        var areaPAB = Math.abs((this.a.x * (this.b.z - v.z) + this.b.x * (v.z - this.a.z) + v.x * (this.a.z - this.b.z)) / 2.0);

        return new Vector3(v.x, (areaPBC * this.a.y + areaPCA * this.b.y + areaPAB * this.c.y) / areaABC, v.z);
    }

    copy(){
        return new Triangle(this.a, this.b, this.c);
    }

    static from(a, b, c) {
        return new Triangle(a?.a ?? a[0] ?? a ?? 0,
                            b?.b ?? b[1] ?? b ?? 0,
                            c?.c ?? c[2] ?? c ?? 0);
    }
}