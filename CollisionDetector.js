var Vector3 = (typeof (Vector3) != "undefined") ? Vector3 : require("./Vector3");
var Hitbox3 = (typeof (Hitbox3) != "undefined") ? Hitbox3 : require("./Hitbox3");
var PhysicsBody3 = (typeof (PhysicsBody3) != "undefined") ? PhysicsBody3 : require("./PhysicsBody3");
var Composite = (typeof (Composite) != "undefined") ? Composite : require("./Composite");
var Terrain3 = (typeof (Terrain3) != "undefined") ? Terrain3 : require("./Terrain3");
var Sphere = (typeof (Sphere) != "undefined") ? Sphere : require("./Sphere");
var Triangle = (typeof (Triangle) != "undefined") ? Triangle : require("./Triangle");

var CollisionDetector = class {
    constructor() {
        var pairs = new Set();
    }

    alreadyHandled(pairs, shape1, shape2) {
        if(shape1 == shape2) {
            return true;
        }
        if(shape1.id > shape2.id) {
            var temp = shape1;
            shape1 = shape2;
            shape2 = temp;
        }

        return pairs.has(shape1.id + ":" + shape2.id);
    }

    addPair(shape1, shape2) {
        if(shape1 == shape2) {
            return;
        }
        if(shape1.id > shape2.id) {
            var temp = shape1;
            shape1 = shape2;
            shape2 = temp;
        }
        pairs.add(shape1.id + ":" + shape2.id);
    }

    detectCollision(shape1, shape2) {
        if(shape1.shape > shape2.shape) {
            var temp = shape1;
            shape1 = shape2;
            shape2 = temp;
        }

        if(shape1.shape == Composite.SHAPES.SPHERE && shape2.shape == Composite.SHAPES.SPHERE) {
            return this.handleSphereSphere(shape1, shape2);
        }
        return false;
    }

    handleSphereSphere(shape1, shape2) {

        return false;

    }

};



if (typeof (module) != "undefined") {
    module.exports = CollisionDetector;
}