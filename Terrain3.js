var Vector3 = (typeof (Vector3) != "undefined") ? Vector3 : require("./Vector3");
var Hitbox3 = (typeof (Hitbox3) != "undefined") ? Hitbox3 : require("./Hitbox3");
var PhysicsBody3 = (typeof (PhysicsBody3) != "undefined") ? PhysicsBody3 : require("./PhysicsBody3");
var Composite = (typeof (Composite) != "undefined") ? Composite : require("./Composite");
var Triangle = (typeof (Triangle) != "undefined") ? Triangle : require("./Triangle");

var Terrain3 = class extends Composite {
    constructor(options) {
        super(options);

        this.shape = this.constructor.SHAPES.TERRAIN3;

        this.heightmaps = {};

        this.heightmaps.width = options?.heightmaps?.width ?? 2;
        this.heightmaps.depth = options?.heightmaps?.depth ?? 2;
        this.heightmaps.widthSegments = options?.heightmaps?.widthSegments ?? this.heightmaps.width - 1 ?? 1;
        this.heightmaps.depthSegments = options?.heightmaps?.depthSegments ?? this.heightmaps.depth - 1 ?? 1;

        this.heightmaps.top = {};
        this.heightmaps.top.map = options?.heightmaps?.top?.map ?? new Float32Array(this.heightmaps.width * this.heightmaps.depth);

        this.heightmaps.bottom = {};
        this.heightmaps.bottom.map = options?.heightmaps?.bottom?.map ?? new Float32Array(this.heightmaps.width * this.heightmaps.depth);

        this.terrainScale = options?.terrainScale ?? 1;
        this.inverseTerrainScale = options?.inverseTerrainScale ?? 1 / this.terrainScale;

        this.terrainWidth = options?.terrainWidth ?? this.heightmaps.widthSegments * this.terrainScale;
        this.terrainDepth = options?.terrainDepth ?? this.heightmaps.depthSegments * this.terrainScale;
        
        this.setLocalFlag(this.constructor.FLAGS.OCCUPIES_SPACE, true);
        
        this.calculateLocalHitbox();
        this.calculateGlobalHitbox();
    }

    calculateLocalMomentOfInertia() {
        this.local.body.momentOfInertia = Matrix3.zero();
        return this.local.body.momentOfInertia;
    }

    rotateLocalMomentOfInertia(quaternion) {
        return this.local.body.momentOfInertia;
    }

    balance() {
        var averageHeight = 0;
        for (var i = 0; i < this.heightmaps.top.map.length; i++) {
            averageHeight += this.heightmaps.top.map[i] + this.heightmaps.bottom.map[i];
        }
        averageHeight /= this.heightmaps.top.map.length * 2;
        
        for (var i = 0; i < this.heightmaps.top.map.length; i++) {
            this.heightmaps.top.map[i] -= averageHeight;
            this.heightmaps.bottom.map[i] -= averageHeight;
        }

        this.calculateLocalHitbox();
    }

    calculateLocalHitbox() {

        var minHeight = Infinity;
        var maxHeight = -Infinity;
        for (var i = 0; i < this.heightmaps.top.map.length; i++) {
            maxHeight = Math.max(maxHeight, this.heightmaps.top.map[i]);
        }

        for (var i = 0; i < this.heightmaps.bottom.map.length; i++) {
            minHeight = Math.min(minHeight, this.heightmaps.bottom.map[i]);
        }

        this.local.hitbox.min = new Vector3(-this.terrainWidth / 2, minHeight, -this.terrainDepth / 2);
        this.local.hitbox.max = new Vector3(this.terrainWidth / 2, maxHeight, this.terrainDepth / 2);

        return this.local.hitbox;
    }

    clampToHeightmap(v){
        return new Vector3(Math.max(0, Math.min(this.heightmaps.widthSegments, v.x)), v.y, Math.max(0, Math.min(this.heightmaps.depthSegments, v.z)));
    }

    calculateGlobalHitbox() {
        var localHitbox = this.local.hitbox;

        var updateForVertex = function (v) {
            this.global.body.rotation.multiplyVector3InPlace(v).addInPlace(this.global.body.position);
            this.global.hitbox.expandToFitPoint(v);
        }.bind(this);

        this.global.hitbox.min = new Vector3(Infinity, Infinity, Infinity);
        this.global.hitbox.max = new Vector3(-Infinity, -Infinity, -Infinity);

        updateForVertex(localHitbox.min.copy());
        updateForVertex(localHitbox.max.copy());
        updateForVertex(new Vector3(localHitbox.min.x, localHitbox.min.y, localHitbox.max.z));
        updateForVertex(new Vector3(localHitbox.min.x, localHitbox.max.y, localHitbox.min.z));
        updateForVertex(new Vector3(localHitbox.min.x, localHitbox.max.y, localHitbox.max.z));
        updateForVertex(new Vector3(localHitbox.max.x, localHitbox.min.y, localHitbox.min.z));
        updateForVertex(new Vector3(localHitbox.max.x, localHitbox.min.y, localHitbox.max.z));
        updateForVertex(new Vector3(localHitbox.max.x, localHitbox.max.y, localHitbox.min.z));
        return this.global.hitbox;
    }

    setTerrainScale(x) {
        this.terrainScale = x;
        this.inverseTerrainScale = 1 / x;
        this.terrainWidth = this.heightmaps.widthSegments * this.terrainScale;
        this.terrainDepth = this.heightmaps.depthSegments * this.terrainScale;
        this.calculateLocalHitbox();
    }

    setMaps(top, bottom) {
        this.heightmaps.top.map = top;
        this.heightmaps.bottom.map = bottom;
        this.calculateLocalHitbox();
    }


    updateNormals() {

    }


    static from2dArrays(top, bottom) {
        var topMap = new Float32Array(top.flat());
        var bottomMap = new Float32Array(bottom.flat());

        return new this({
            heightmaps: {
                width: top[0].length,
                depth: top.length,
                top: { map: topMap },
                bottom: { map: bottomMap }
            }
        });
    }

    static getArrayFromImage(img, scale = 1 / 255) {
        var canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        var ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        var data = ctx.getImageData(0, 0, img.width, img.height).data;
        var heightmaps = [];
        for (var i = 0; i < data.length; i += 4) {
            var sum = 0;
            var count = 0;
            const amount = 2;
            for (var x = -amount; x <= amount; x++) {
                for (var y = -amount; y <= amount; y++) {
                    var index = i + y * 4 * img.width + x * 4;
                    var a = (data[index] + data[index + 1] + data[index + 2]) / 3;
                    sum += a ? a : 0;
                    count++;
                }
            }
            heightmaps.push(sum / count * scale);
        }
        return heightmaps;
    }

    static fromDimensions(width, depth) {

        return new this({
            heightmaps: {
                width: width,
                depth: depth,
            }
        });
    }

    from2dArrays(top, bottom) {

        this.heightmaps.top.map = new Float32Array(top.flat());
        this.heightmaps.top.hitbox = this.makeHitbox(this.heightmaps.top);

        this.heightmaps.bottom.map = new Float32Array(bottom.flat());
        this.heightmaps.bottom.hitbox = this.makeHitbox(this.heightmaps.bottom);

        this.calculateLocalHitbox();
        return this;
    }

    getNearestTile(v) {
        var x = Math.floor(v.x);
        var z = Math.floor(v.z);

        x = Math.max(0, Math.min(this.heightmaps.width - 2, x));
        z = Math.max(0, Math.min(this.heightmaps.depth - 2, z));


        return new Vector3(x, 0, z);
    }

    getTriangle(map, v) {
        if (v.z <= 0 || v.z >= this.heightmaps.depthSegments || v.x <= 0 || v.x >= this.heightmaps.widthSegments) {
            return null;
        }
        var v1 = this.getNearestTile(v);
        v1.y = this.getHeight(map, v1);

        var v2 = v1.copy();
        v2.x++;
        v2.y = this.getHeight(map, v2);

        var v3 = v1.copy();
        v3.z++;
        v3.y = this.getHeight(map, v3);

        

        if (v2.x - v.x > v.z - v1.z) {
            return new Triangle(v2, v1, v3);
        }

        var v4 = v1.copy();
        v4.x++;
        v4.z++;
        v4.y = this.getHeight(map, v4);

        return new Triangle(v2, v3, v4);
    }

    getHeightFromHeightmap(map, v) {
        var translated_v = this.translateWorldToHeightmap(v);

        var triangle = this.getTriangle(map, translated_v);
        if (!triangle) {
            return null;
        }

        return this.translateHeightmapToWorld(triangle.getHeight(translated_v));
    }

    translateWorldToHeightmap(v) {
        return this.translateLocalToHeightmap(this.translateWorldToLocal(v));
    }

    translateWorldToLocal(v) {
        return this.global.body.rotation.conjugate().multiplyVector3(v.subtract(this.global.body.position));
    }

    translateLocalToWorld(v) {
        return this.global.body.rotation.multiplyVector3(v)
            .addInPlace(this.global.body.position);
    }

    translateLocalToHeightmap(v) {
        return v.multiplyInPlace(new Vector3(this.inverseTerrainScale, 1, this.inverseTerrainScale))
            .addInPlace(new Vector3(this.heightmaps.widthSegments / 2, 0, this.heightmaps.depthSegments / 2));
    }

    translateHeightmapToLocal(v) {
        return v.subtract(new Vector3(this.heightmaps.widthSegments / 2, 0, this.heightmaps.depthSegments / 2))
            .multiplyInPlace(new Vector3(this.terrainScale, 1, this.terrainScale));
    }

    translateHeightmapToWorld(v) {
        return this.translateLocalToWorld(this.translateHeightmapToLocal(v));
    }

    getHeight(map, v) {
        return map.map[Math.floor(v.z) * this.heightmaps.width + Math.floor(v.x)];
    }


    calculateMeshVertices(geometry, map) {
        var attrib = geometry.attributes;

        /*for (var i = 0; i < attrib.position.count; i += 6) {
            var i2 = i / 6;
            var posV = new Vector3(i2 % this.heightmaps.widthSegments, 0, Math.floor(i2 / this.heightmaps.widthSegments));

            var v = new Vector3(posV.x, this.getHeight(map, posV), posV.z);

            posV.x++;
            var v1 = new Vector3(posV.x, this.getHeight(map, posV), posV.z);

            posV.x--;
            posV.z++;
            var v2 = new Vector3(posV.x, this.getHeight(map, posV), posV.z);

            posV.x++;
            var v3 = new Vector3(posV.x, this.getHeight(map, posV), posV.z);

            v = this.translateHeightmapToLocal(v);
            v1 = this.translateHeightmapToLocal(v1);
            v2 = this.translateHeightmapToLocal(v2);
            v3 = this.translateHeightmapToLocal(v3);

            attrib.position.setXYZ(i, v.x, v.y, v.z);
            attrib.position.setXYZ(i + 1, v2.x, v2.y, v2.z);
            attrib.position.setXYZ(i + 2, v1.x, v1.y, v1.z);

            attrib.position.setXYZ(i + 3, v2.x, v2.y, v2.z);
            attrib.position.setXYZ(i + 4, v3.x, v3.y, v3.z);
            attrib.position.setXYZ(i + 5, v1.x, v1.y, v1.z);
        }*/

        for (var i = 0; i < attrib.position.count; i++) {
            attrib.position.array[i * 3 + 1] = map.map[i];
        }

        attrib.position.needsUpdate = true;
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();
    }
    setMesh(material) {
        var topGeo = new THREE.PlaneGeometry(this.terrainWidth, this.terrainDepth, this.heightmaps.widthSegments, this.heightmaps.depthSegments);
        /*topGeo = topGeo.toNonIndexed();*/

        topGeo.rotateX(-Math.PI / 2);
        var topAttrib = topGeo.attributes;
        this.calculateMeshVertices(topGeo, this.heightmaps.top);


        var topColor = new Float32Array(topAttrib.position.count * 3);
        for (var i = 0; i < topAttrib.position.count; i++) {
            var y = i * 3;
            topColor[y] = 1;
            topColor[y + 1] = 1;
            topColor[y + 2] = 1;
        }

        topGeo.setAttribute('color', new THREE.BufferAttribute(topColor, 3));


        this.mesh = new THREE.Mesh();

        var topMesh = new THREE.Mesh(topGeo, material);

        this.mesh.add(topMesh);
    }
};

if (typeof (module) != "undefined") {
    module.exports = Terrain3;
}