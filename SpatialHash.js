var Vector3 = (typeof (Vector3) != "undefined") ? Vector3 : require("./Vector3");


var SpatialHash = class {
    static seperatorCharacter = ":";
    constructor(options) {
        this.world = options?.world ?? null;
        this.spatialHashes = [];
        for (var i = 0; i < (options?.gridSizes?.length ?? 16); i++) {
            var spatialHash = {};
            spatialHash.hashmap = new Map();
            spatialHash.gridSize = options?.gridSizes[i] ?? Math.pow(2, i);
            spatialHash.inverseGridSize = 1 / spatialHash.gridSize;
            spatialHash.threshold = options?.thresholds[i] ?? 256;
            this.spatialHashes.push(spatialHash);
        }
        for (var i = 0; i < this.spatialHashes.length - 1; i++) {
            this.spatialHashes[i].next = this.spatialHashes[i + 1];
            this.spatialHashes[i].final = false;
        }
        this.global = new Set();
        this.spatialHashes.push({ final: true, hashmap: this.global });
        this.spatialHashes[this.spatialHashes.length - 2].next = this.spatialHashes[this.spatialHashes.length - 1];
        this.spatialHashes[this.spatialHashes.length - 2].final = false;
    }

    hash(cellPos) {
        return cellPos.x + this.constructor.seperatorCharacter + cellPos.y + this.constructor.seperatorCharacter + cellPos.z;
    }

    getCellPosition(v, hash) {
        return new Vector3(Math.floor(v.x * hash.inverseGridSize), Math.floor(v.y * hash.inverseGridSize), Math.floor(v.z * hash.inverseGridSize));
    }

    addHitbox(hitbox, id, hash = this.spatialHashes[0]) {
        if (hash.final) {
            hash.hashmap.add(id);
            return true;
        }
        var min = this.getCellPosition(hitbox.min, hash);
        var max = this.getCellPosition(hitbox.max, hash);
        if ((max.x - min.x + 1) * (max.y - min.y + 1) * (max.z - min.z + 1) > hash.threshold) {
            return this.addHitbox(hitbox, id, hash.next);
        }
        var v = min.copy();
        for (v.x = min.x; v.x <= max.x; v.x++) {
            for (v.y = min.y; v.y <= max.y; v.y++) {
                for (v.z = min.z; v.z <= max.z; v.z++) {
                    var cell = this.hash(v);
                    this.addToCell(cell, id, hash);
                }
            }
        }
    }

    removeHitbox(hitbox, id, hash = this.spatialHashes[0]) {
        if (hash.final) {
            hash.hashmap.delete(id);
            return true;
        }
        var min = this.getCellPosition(hitbox.min, hash);
        var max = this.getCellPosition(hitbox.max, hash);
        if ((max.x - min.x + 1) * (max.y - min.y + 1) * (max.z - min.z + 1) > hash.threshold) {
            return this.removeHitbox(hitbox, id, hash.next);
        }
        var v = min.copy();
        for (v.x = min.x; v.x <= max.x; v.x++) {
            for (v.y = min.y; v.y <= max.y; v.y++) {
                for (v.z = min.z; v.z <= max.z; v.z++) {
                    var cell = this.hash(v);
                    this.removeFromCell(cell, id, hash);
                }
            }
        }
    }

    removeFromCell(cell, id, hash) {
        var map = hash.hashmap.get(cell);
        if (!map) {
            
            return false;
        }
        var index = map.indexOf(id);
        if (index == -1) {
            return false;
        }
        map.splice(index, 1);
        if (map.length == 0) {
            hash.hashmap.delete(cell);
        }
        return true;
    }

    addToCell(cell, id, hash) {
        var map = hash.hashmap.get(cell);
        if (!map) {
            map = [];
            hash.hashmap.set(cell, map);
        }
        map.push(id);
        return true;
    }

    query(point, result = [], hash = this.spatialHashes[0]) {
        if (hash.final) {
            if(hash.hashmap.size == 0){
                return result;
            }
            hash.hashmap.forEach(function(v){
                result.push(v);
            });
            return result;
        }
        var min = this.getCellPosition(point, hash);
        var max = this.getCellPosition(point, hash);
        var v = min.copy();
        for (v.x = min.x; v.x <= max.x; v.x++) {
            for (v.y = min.y; v.y <= max.y; v.y++) {
                for (v.z = min.z; v.z <= max.z; v.z++) {
                    var cell = this.hash(v);
                    var map = hash.hashmap.get(cell);
                    if (map) {
                        for (var i = 0; i < map.length; i++) {
                            result.push(map[i]);
                        }
                    }
                }
            }
        }
        return this.query(point, result, hash.next);
    }
}

/*
var a = new SpatialHash();

console.time("a");
var total = 0;
for (var i = 0; i < 6000; i++) {
    var b = new Hitbox3(new Vector3(Math.random() * 3000, Math.random() * 3000, Math.random() * 3000), new Vector3(Math.random() * 3000 + 3001, Math.random() * 3000 + 3001, Math.random() * 3000 + 3001));
    if(b.containsPoint(new Vector3(3000, 3000, 3000))) {
        total++;
    }
    a.addHitbox(b, i);
    //a.removeHitbox(b, i);
}
console.timeEnd("a");



setInterval(() => {

console.time("b");
for (var i = 0; i < 6000; i++) {
    a.query(new Vector3(0, 0, 0));    
}
console.timeEnd("b");

},1000);*/