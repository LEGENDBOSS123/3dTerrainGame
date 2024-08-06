var Vector3 = (typeof (Vector3) != "undefined") ? Vector3 : require("./Vector3");
var Hitbox3 = (typeof (Hitbox3) != "undefined") ? Hitbox3 : require("./Hitbox3");
var PhysicsBody3 = (typeof (PhysicsBody3) != "undefined") ? PhysicsBody3 : require("./PhysicsBody3");
var Composite = (typeof (Composite) != "undefined") ? Composite : require("./Composite");
var Terrain3 = (typeof (Terrain3) != "undefined") ? Terrain3 : require("./Terrain3");
var Sphere = (typeof (Sphere) != "undefined") ? Sphere : require("./Sphere");
var Triangle = (typeof (Triangle) != "undefined") ? Triangle : require("./Triangle");
var Contact = (typeof (Contact) != "undefined") ? Contact : require("./Contact");


var CollisionDetector = class {

    static seperatorCharacter = ":";

    constructor(options) {
        this.pairs = options?.pairs ?? new Map();
        this.world = options?.world ?? null;
        this.contacts = options?.contacts ?? [];
    }

    inPairs(pairs, shape1, shape2) {
        if (shape1 == shape2) {
            return true;
        }
        if (shape1.id > shape2.id) {
            return this.pairs.has(shape2.id + this.constructor.seperatorCharacter + shape1.id);
        }

        return this.pairs.has(shape1.id + this.constructor.seperatorCharacter + shape2.id);
    }

    addPair(shape1, shape2) {
        if (shape1 == shape2) {
            return;
        }
        if (shape1.id > shape2.id) {
            return this.pairs.set(shape2.id + this.constructor.seperatorCharacter + shape1.id, [shape2, shape1]);
        }
        return this.pairs.set(shape1.id + this.constructor.seperatorCharacter + shape2.id, [shape1, shape2]);
    }

    detectCollision(shape1, shape2) {
        if (shape1.shape > shape2.shape) {
            var temp = shape1;
            shape1 = shape2;
            shape2 = temp;
        }
        if (shape1.shape == Composite.SHAPES.SPHERE && shape2.shape == Composite.SHAPES.SPHERE) {
            return this.handleSphereSphere(shape1, shape2);
        }

        if (shape1.shape == Composite.SHAPES.SPHERE && shape2.shape == Composite.SHAPES.TERRAIN3) {
            return this.handleSphereTerrain(shape1, shape2);
        }

        if (shape1.shape == Composite.SHAPES.TERRAIN3 && shape2.shape == Composite.SHAPES.POINT) {
            return this.handleTerrainPoint(shape1, shape2);
        }

        return false;
    }

    handle(shape) {
        var query = world.spatialHash.query(shape.id);
        for (var i of query) {
            this.addPair(shape, this.world.all[i]);
        }
    }

    handleAll(shapes) {
        for (var i = 0; i < shapes.length; i++) {
            this.handle(shapes[i]);
        }
    }


    resolveAll() {
        for (var [key, value] of this.pairs) {
            var collisionData = this.detectCollision(value[0], value[1]);
            if (collisionData) {
                this.contacts.push(collisionData);
            }
        }
        this.resolveAllContacts();
        this.pairs.clear();
    }

    broadphase(shape1, shape2) {
        return shape1.global.hitbox.intersects(shape2.global.hitbox);
    }

    resolveAllContacts() {
        var map = new Map();

        for (var i = 0; i < this.contacts.length; i++) {
            var contact = this.contacts[i];
            if (!map.has(contact.body1.maxParent.id)) {
                map.set(contact.body1.maxParent.id, []);
            }

            if (!map.has(contact.body2.maxParent.id)) {
                map.set(contact.body2.maxParent.id, []);
            }

            map.get(contact.body1.maxParent.id).push(contact);
            map.get(contact.body2.maxParent.id).push(contact);
        }

        for (var [key, value] of map) {
            var inverseLength = 1 / value.length;
            for (var i = 0; i < value.length; i++) {
                var contact = value[i];

                /*var velocityBefore = contact.velocity.projectOnto(contact.normal);
                var velocityAfter = contact.velocity.projectOntoPlane(contact.normal);
                var impulse = velocityAfter.subtract(contact.velocity).scaleInPlace(contact.body1.global.body.mass);
                contact.body1.applyForce(impulse.scale(inverseLength), contact.point);*/

                var impactSpeed = contact.velocity.dot(contact.normal);

                var normalForce = -1 * contact.body1.maxParent.global.body.mass * impactSpeed;

                var tangential = contact.velocity.projectOntoPlane(contact.normal);
                var maxFriction = tangential.magnitude() * contact.body1.maxParent.global.body.mass;
                tangential.normalizeInPlace();

                var friction = normalForce * 0.9;

                if(normalForce < 0){
                    normalForce = 0;
                    tangential = new Vector3(0,0,0);
                }

                var force = new Vector3();
                force.addInPlace(contact.normal.scale(normalForce));
                force.addInPlace(tangential.scale(-1 * Math.min(maxFriction * 0.5, friction)));
                //console.log(normalForce);
                contact.body1.applyForce(force.scale(inverseLength), contact.point);
                
            }
            for(var i = 0; i < value.length; i++){
                var contact = value[i];
                contact.body1.translate(new Vector3(0, contact.penetration * inverseLength, 0));
            }
        }
        this.contacts.length = 0;
    }

    handleSphereSphere(sphere1, sphere2) {
        if (sphere1.body.position.distanceTo(sphere2.body.position) > sphere1.body.radius + sphere2.body.radius) {
            return false;
        }

        var contact = new Contact();
        contact.point = sphere1.body.position.add(sphere2.body.position).scale(0.5);
        contact.velocity = sphere1.body.velocity.add(sphere2.body.velocity).scale(0.5);

    }

    handleSphereTerrain(sphere1, terrain1) {

    }

    handleTerrainPoint(terrain1, point1) {
        var pointPos = point1.global.body.position;
        
        var pointPosPrev = point1.global.body.actualPreviousPosition;
        //console.log(pointPosPrev+"");
        var translatedPointPos = terrain1.translateWorldToLocal(pointPos);
        var heightmapPos = terrain1.translateLocalToHeightmap(translatedPointPos);
        var translatedPointPosPrev = terrain1.translateWorldToLocal(pointPosPrev);
        var heightmapPosPrev = terrain1.clampToHeightmap(terrain1.translateLocalToHeightmap(translatedPointPosPrev));

        if (heightmapPos.x <= 0 || heightmapPos.x >= terrain1.heightmaps.widthSegments || heightmapPos.z <= 0 || heightmapPos.z >= terrain1.heightmaps.depthSegments) {
            return false;
        }        

        var triangleTop = terrain1.getTriangle(terrain1.heightmaps.top, heightmapPos);
        var triangleBottom = terrain1.getTriangle(terrain1.heightmaps.bottom, heightmapPos);

        var triangle = new Triangle(triangleTop.a.add(triangleBottom.a).scaleInPlace(0.5), triangleTop.b.add(triangleBottom.b).scaleInPlace(0.5), triangleTop.c.add(triangleBottom.c).scaleInPlace(0.5));


        var height = 0;
        var top = true;
        var normal = new Vector3(0,0,0);
        var height1 = triangle.getHeight(heightmapPosPrev);
        var height2 = triangle.getHeight(heightmapPosPrev);
        if(1==0 && heightmapPos.y > height1.y && heightmapPosPrev.y > height2.y){
            
            top = true;
        }
        else if(1==0 && heightmapPos.y < height1.y && heightmapPosPrev.y < height2.y){
            top = false;
        }
        else{
            var triangle2 = triangle.copy();
            triangle2.a = terrain1.translateHeightmapToWorld(triangle2.a);
            triangle2.b = terrain1.translateHeightmapToWorld(triangle2.b);
            triangle2.c = terrain1.translateHeightmapToWorld(triangle2.c);

            var velocity = point1.global.body.getVelocity();//pointPos.subtract(p);
            normal = triangle2.getNormal();
            var pointVelocity = velocity.dot(normal);
            if(pointVelocity > 0){
                //top = false;
            }
        }

        if(top){
            var height = terrain1.translateHeightmapToWorld(triangleTop.getHeight(heightmapPos));
            if(pointPos.y < height.y){
                var contact = new Contact();
                contact.normal = normal;
                contact.penetration = height.y - pointPos.y;
                contact.body1 = point1;
                contact.body2 = terrain1;
                contact.point = point1.global.body.position;
                contact.velocity = point1.getVelocityAtPosition(contact.point).subtractInPlace(terrain1.getVelocityAtPosition(contact.point));
                return contact;
                
            }
        }
        else{
            var height = terrain1.translateHeightmapToWorld(triangleBottom.getHeight(heightmapPos));
            if(pointPos.y > height.y){
                point1.translate(new Vector3(0, height.y - pointPos.y, 0));
            }
        }

        //return true;
        /*
        var height = terrain1.getHeightFromHeightmap(terrain1.heightmaps.top, point1.global.body.position.copy());
        if(height != null){
            if(point1.global.body.position.y < height.y){
                point1.global.body.position = height.copy();
            }
        }
        return true;*/
    }

};



if (typeof (module) != "undefined") {
    module.exports = CollisionDetector;
}