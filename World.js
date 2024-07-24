var Vector3 = (typeof (Vector3) != "undefined") ? Vector3 : require("./Vector3");
var Terrain3 = (typeof (Terrain3) != "undefined") ? Terrain3 : require("./Terrain3");
var PhysicsBody3 = (typeof (PhysicsBody3) != "undefined") ? PhysicsBody3 : require("./PhysicsBody3");

var World = class {
    constructor(options) {
        this.maxID = options?.maxID ?? 0;
        this.id = options?.id ?? (this.maxID++);
        this.all = options?.all ?? {};
        if(!(this in this.all)){
            this.all[this.id] = this;
        }

        this.composites = options?.composites ?? [];
    }

    addComposite(composite) {
        this.add(composite);
        this.composites.push(composite);
    }

    add(element) {
        element.id = (this.maxID++);
        this.all[element.id] = element;
        return element;
    }
}



if (typeof (module) != "undefined") {
    module.exports = World;
}