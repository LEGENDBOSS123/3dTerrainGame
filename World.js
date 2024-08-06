var Vector3 = (typeof (Vector3) != "undefined") ? Vector3 : require("./Vector3");
var Terrain3 = (typeof (Terrain3) != "undefined") ? Terrain3 : require("./Terrain3");
var PhysicsBody3 = (typeof (PhysicsBody3) != "undefined") ? PhysicsBody3 : require("./PhysicsBody3");
var SpatialHash = (typeof (SpatialHash) != "undefined") ? SpatialHash : require("./SpatialHash");
var World = class {
    constructor(options) {
        this.maxID = options?.maxID ?? 0;
        this.deltaTime = options?.deltaTime ?? 1;
        this.deltaTimeSquared = this.deltaTime * this.deltaTime;
        this.inverseDeltaTime = 1 / this.deltaTime;
        
        this.iterations = options?.iterations ?? 1;

        this.id = options?.id ?? (this.maxID++);
        this.all = options?.all ?? {};

        if(!(this in this.all)){
            this.all[this.id] = this;
        }

        this.composites = options?.composites ?? [];
        this.spatialHash = options?.spatialHash ?? new SpatialHash({ world: this });
        this.collisionDetector = options?.collisionDetector ?? new CollisionDetector({ world: this });
    }

    setDeltaTime(deltaTime) {
        this.deltaTime = deltaTime;
        this.deltaTimeSquared = this.deltaTime * this.deltaTime;
        this.inverseDeltaTime = 1 / this.deltaTime;
    }

    setIterations(iterations) {
        this.iterations = iterations;
        this.setDeltaTime(1 / this.iterations);
    }

    addComposite(composite) {
        this.add(composite);
        this.composites.push(composite);
    }

    add(element) {
        element.id = (this.maxID++);
        element.world = this;
        this.all[element.id] = element;
        return element;
    }

    updateBeforeCollisionAll() {
        for (var i = 0; i < this.composites.length; i++) {
            if(this.composites[i].isMaxParent()){
                this.composites[i].updateBeforeCollisionAll();
            }
        }
    }

    updateAfterCollisionAll() {
        for (var i = 0; i < this.composites.length; i++) {
            if(this.composites[i].isMaxParent()){
                this.composites[i].updateAfterCollisionAll();
            }
        }
    }

    step() {
        for(var i = 0; i < this.iterations; i++){
            this.updateBeforeCollisionAll();
            this.collisionDetector.handleAll(this.composites);
            this.collisionDetector.resolveAll();
            this.updateAfterCollisionAll();
        }
    }
};



if (typeof (module) != "undefined") {
    module.exports = World;
}