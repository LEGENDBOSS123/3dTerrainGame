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
        return v1.cross(v2).normalizeInPlace();
    }

    getCentroid() {
        return this.a.add(this.b).add(this.c).scaleInPlace(1 / 3);
    }

    getArea() {
        var v1 = this.b.subtract(this.a);
        var v2 = this.c.subtract(this.a);
        return v1.cross(v2).magnitude() / 2;
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

    getHeight(v) {
        var areaABC = Math.abs((this.a.x * (this.b.z - this.c.z) + this.b.x * (this.c.z - this.a.z) + this.c.x * (this.a.z - this.b.z)) / 2.0);
        var areaPBC = Math.abs((v.x * (this.b.z - this.c.z) + this.b.x * (this.c.z - v.z) + this.c.x * (v.z - this.b.z)) / 2.0);
        var areaPCA = Math.abs((this.a.x * (v.z - this.c.z) + v.x * (this.c.z - this.a.z) + this.c.x * (this.a.z - v.z)) / 2.0);
        var areaPAB = Math.abs((this.a.x * (this.b.z - v.z) + this.b.x * (v.z - this.a.z) + v.x * (this.a.z - this.b.z)) / 2.0);

        return new Vector3(v.x, (areaPBC * this.a.y + areaPCA * this.b.y + areaPAB * this.c.y) / areaABC, v.z);
    }

    getClosestPoint(point) {
        const ab = this.b.subtract(this.a);
        const ac = this.c.subtract(this.a);
        const ap = point.subtract(this.a);

        const d1 = ab.dot(ap);
        const d2 = ac.dot(ap);

        if (d1 <= 0 && d2 <= 0) return this.a; // Closest to vertex a

        const bp = point.subtract(this.b);
        const d3 = ab.dot(bp);
        const d4 = ac.dot(bp);

        if (d3 >= 0 && d4 <= d3) return this.b; // Closest to vertex b

        const cp = point.subtract(this.c);
        const d5 = ab.dot(cp);
        const d6 = ac.dot(cp);

        if (d6 >= 0 && d5 <= d6) return this.c; // Closest to vertex c

        const vc = d1 * d4 - d3 * d2;
        if (vc <= 0 && d1 >= 0 && d3 <= 0) {
            const v = d1 / (d1 - d3);
            return this.a.add(ab.scale(v)); // Closest to edge ab
        }

        const vb = d5 * d2 - d1 * d6;
        if (vb <= 0 && d2 >= 0 && d6 <= 0) {
            const w = d2 / (d2 - d6);
            return this.a.add(ac.scale(w)); // Closest to edge ac
        }

        const va = d3 * d6 - d5 * d4;
        if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) {
            const u = (d4 - d3) / ((d4 - d3) + (d5 - d6));
            return this.b.add(this.c.subtract(this.b).scale(u)); // Closest to edge bc
        }

        const denom = 1 / (va + vb + vc);
        const v = vb * denom;
        const w = vc * denom;
        return this.a.add(ab.scale(v)).add(ac.scale(w)); // Inside the triangle
    }

    closestPointOnLineSegment(v1, v2, point){
        var v12 = v2.subtract(v1);
        var v13 = point.subtract(v1);

        var t = v13.dot(v12) / v12.dot(v12);

        if(t < 0){
            return v1;
        } else if(t > 1){
            return v2;
        } else {
            return v1.add(v12.scale(t));
        }
    }

    intersectsSphere = function (position, radius) {
        if(!this.containsPoint(position)){
            var points = [this.closestPointOnLineSegment(this.a, this.b, position), this.closestPointOnLineSegment(this.b, this.c, position), this.closestPointOnLineSegment(this.c, this.a, position)];
            var distances = [points[0].distanceSquared(position), points[1].distanceSquared(position), points[2].distanceSquared(position)];
            var minIndex = -1;

            for (var i = 0; i < distances.length; i++) {
                if (distances[i] < distances[minIndex] && distances[i] < radius * radius) {
                    minIndex = i;
                }
            }
            if(minIndex == -1){
                return null;
            }
            return points[minIndex];
        }
        var normal = this.getNormal();
        var distance = normal.dot(position.subtract(this.a));
        var planePoint = position.add(normal.scale(distance));

        if (planePoint.distanceSquared(position) > radius * radius) {
            return null;
        }
        return planePoint;
    };


    copy() {
        return new Triangle(this.a, this.b, this.c);
    }

    static from(a, b, c) {
        return new Triangle(a?.a ?? a[0] ?? a ?? 0,
            b?.b ?? b[1] ?? b ?? 0,
            c?.c ?? c[2] ?? c ?? 0);
    }
}