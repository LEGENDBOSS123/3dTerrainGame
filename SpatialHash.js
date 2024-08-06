var Vector3 = (typeof (Vector3) != "undefined") ? Vector3 : require("./Vector3");


var ObjectMap = class {
    constructor() {
        this.map = Object.create(null);
    }
    get(key) {
        return this.map[key];
    }
    set(key, value) {
        this.map[key] = value;
    }
    delete(key) {
        delete this.map[key];
    }
    clear() {
        this.map = Object.create(null);
    }
    keys() {
        return Object.keys(this.map);
    }
    get size() {
        return Object.keys(this.map).length;
    }
};

var SpatialHash = class {
    static seperatorCharacter = ":";
    constructor(options) {
        this.world = options?.world ?? null;
        this.spatialHashes = [];
        for (var i = 0; i < (options?.gridSizes?.length ?? 30); i++) {
            var spatialHash = {};
            spatialHash.hashmap = new Map();
            spatialHash.gridSize = options?.gridSizes?.[i] ?? Math.pow(8, i);
            spatialHash.inverseGridSize = 1 / spatialHash.gridSize;
            spatialHash.threshold = options?.thresholds?.[i] ?? 8;
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
        this.ids = {};

    }

    hash(cellPos) {
        return cellPos.x + this.constructor.seperatorCharacter + cellPos.y + this.constructor.seperatorCharacter + cellPos.z;
    }

    getCellPosition(v, hash) {
        return new Vector3(Math.floor(v.x * hash.inverseGridSize), Math.floor(v.y * hash.inverseGridSize), Math.floor(v.z * hash.inverseGridSize));
    }

    getSizeHeuristic(min, max) {
        return (max.x - min.x + 1) * (max.y - min.y + 1) * (max.z - min.z + 1);
    }

    _addHitbox(hitbox, id, hash = this.spatialHashes[0]) {
        if (hash.final) {
            hash.hashmap.add(id);
            this.ids[id].hash = hash;
            return true;
        }
        var min = this.getCellPosition(hitbox.min, hash);
        var max = this.getCellPosition(hitbox.max, hash);
        if (this.getSizeHeuristic(min, max) > hash.threshold) {
            return this._addHitbox(hitbox, id, hash.next);
        }
        this.ids[id].hash = hash;
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

    addHitbox(hitbox, id) {
        if(this.ids[id]){
            if(this.ids[id].hitbox.equals(hitbox)){
                return;
            }
            this.removeHitbox(id);
        }
        this.ids[id] = {};
        this.ids[id].hitbox = hitbox.copy();
        this._addHitbox(hitbox, id, this.spatialHashes[0]);
    }

    _removeHitbox(hitbox, id, hash = this.spatialHashes[0]) {
        if (hash.final) {
            hash.hashmap.delete(id);
            return true;
        }
        var min = this.getCellPosition(hitbox.min, hash);
        var max = this.getCellPosition(hitbox.max, hash);
        if (this.getSizeHeuristic(min, max) > hash.threshold) {
            return this._removeHitbox(hitbox, id, hash.next);
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

    removeHitbox(id) {
        if(!this.ids[id]){
            return;
        }
        this._removeHitbox(this.ids[id].hitbox, id, this.ids[id].hash);
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

    _query(hitbox, result = new Map(), hash = this.spatialHashes[0]) {
        if (hash.final) {
            if(hash.hashmap.size == 0){
                return result;//new Set(result);
            }
            for(var i = 0; i < hash.hashmap.size; i++){
                result.push(hash.hashmap.keys[i]);
            }
            return [...(new Set(result))];
        }
        var min = this.getCellPosition(hitbox.min, hash);
        var max = this.getCellPosition(hitbox.max, hash);
        var v = min.copy();
        var map = null;
        var cell = null;
        if(hash.hashmap.size > 0){
            for (v.x = min.x; v.x <= max.x; v.x++) {
                for (v.y = min.y; v.y <= max.y; v.y++) {
                    for (v.z = min.z; v.z <= max.z; v.z++) {
                        cell = this.hash(v);
                        map = hash.hashmap.get(cell);
                        if (map) {
                            for (var i = 0; i < map.length; i++) {
                                //if(this.ids[map[i]].hitbox.intersects(hitbox)){
                                    result.add(map[i]);
                                //}
                            }
                        }
                    }
                }
            }
        }
        return this._query(hitbox, result, hash.next);
    }

    query(id){
        if(!this.ids[id]){
            return [];
        }
        return this._query(this.ids[id].hitbox, new Set(), this.ids[id].hash);
    }
};

/*

var a = new SpatialHash();

console.time("a");
for (var i = 0; i < 7000; i++) {
    var v1 = new Vector3(Math.random() * 30000, Math.random() * 30000, Math.random() * 30000);
    var gg;
    var v2;
    if(i < 1000){
        gg = Math.random() * 1000 + 2200;
        v2 = v1.add(new Vector3(gg, gg, gg));
    }
    else{
        gg = Math.random() * 500;
        v2 = v1.add(new Vector3(gg, gg, gg));
    }
    var b = new Hitbox3(v1, v2);

    a.addHitbox(b, i);
    //a.removeHitbox(i);
}
console.timeEnd("a");



setInterval(() => {

console.time("b");
for (var i = 0; i < 7000; i++) {
    a.query(i);
}
console.log(a.query(100));
console.timeEnd("b");

},1000);*/