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
    static penetrationCoefficient = 0.1;
    static penetrationMax = 1;
    static penetrationDamping = 0.5;

    constructor(options) {
        this.pairs = options?.pairs ?? new Map();
        this.world = options?.world ?? null;
        this.contacts = options?.contacts ?? [];
    }

    inPairs(shape1, shape2) {
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
        var maxParentMap = new Map();
        var allMap = new Map();
        for (var i = 0; i < this.contacts.length; i++) {
            var contact = this.contacts[i];
            if (!maxParentMap.has(contact.body1.maxParent.id)) {
                maxParentMap.set(contact.body1.maxParent.id, []);
            }

            if (!maxParentMap.has(contact.body2.maxParent.id)) {
                maxParentMap.set(contact.body2.maxParent.id, []);
            }

            if (!allMap.has(contact.body1.id)) {
                allMap.set(contact.body1.id, { penetrationSum: 0, contacts: [] });
            }

            if (!allMap.has(contact.body2.id)) {
                allMap.set(contact.body2.id, { penetrationSum: 0, contacts: [] });
            }

            // var body1Contact = allMap.get(contact.body1.id);
            // if(body1Contact.contacts.length == 0){
            //     body1Contact.contacts.push(contact);
            //     maxParentMap.get(contact.body1.maxParent.id).push(contact);
            // }
            // else{
            //     if(body1Contact.contacts[0].penetration < contact.penetration){
            //         allMap.set(contact.body1.id, contact);
            //         maxParentMap.get(contact.body1.maxParent.id).push(contact);
            //     }
            // }

            // var body2Contact = allMap.get(contact.body2.id);
            // if(body2Contact == null){
            //     allMap.set(contact.body2.id, contact);
            //     maxParentMap.get(contact.body2.maxParent.id).push(contact);
            // }
            // else{
            //     if(body2Contact.penetration < contact.penetration){
            //         allMap.set(contact.body2.id, contact);
            //         maxParentMap.get(contact.body2.maxParent.id).push(contact);
            //     }
            // }


            maxParentMap.get(contact.body1.maxParent.id).push(contact);
            maxParentMap.get(contact.body2.maxParent.id).push(contact);
            allMap.get(contact.body1.id).contacts.push(contact);
            allMap.get(contact.body1.id).penetrationSum += contact.penetration;
            allMap.get(contact.body2.id).contacts.push(contact);
            allMap.get(contact.body2.id).penetrationSum += contact.penetration;
        }


        for (var [key, value] of maxParentMap) {

            var inverseLength = 1 / value.length;
            for (var i = 0; i < value.length; i++) {
                var contact = value[i];

                contact.normal.normalizeInPlace();
                var impactSpeed = contact.velocity.dot(contact.normal);
                var force = new Vector3();

                var restitution = 0;
                var radius1 = contact.point.subtract(contact.body1.maxParent.global.body.position);
                var radius2 = contact.point.subtract(contact.body2.maxParent.global.body.position);

                var rotationalEffects1 = contact.normal.dot(contact.body1.maxParent.global.body.inverseMomentOfInertia.multiplyVector3(radius1.cross(contact.normal)).cross(radius1));
                var rotationalEffects2 = contact.normal.dot(contact.body2.maxParent.global.body.inverseMomentOfInertia.multiplyVector3(radius2.cross(contact.normal)).cross(radius2));
                var denominator = contact.body1.maxParent.global.body.inverseMass + rotationalEffects1;
                var impulse = - (1 + restitution) * impactSpeed / denominator;
                if (impulse < 0) {
                    impulse = 0;
                }
            
                var penetrationForce = (Math.min(this.constructor.penetrationCoefficient * contact.penetration + this.constructor.penetrationDamping * impactSpeed, this.constructor.penetrationMax)) * contact.body1.local.body.mass;
                impulse += penetrationForce > 0 ? penetrationForce : 0;
                
                
                var tangential = contact.velocity.projectOntoPlane(contact.normal);
                var maxFriction = tangential.magnitude() / denominator * 0.5;
                tangential.normalizeInPlace();
                var friction = impulse * 0.25;
                force.addInPlace(tangential.scale(-1 * Math.max(0, Math.min(maxFriction, friction))));
                force.addInPlace(contact.normal.scale(impulse));
                contact.body1.applyForce(force.scale(0.5 * inverseLength * contact.penetration / allMap.get(contact.body1.id).penetrationSum), contact.point);
                top.grounded = true;
            }
            for (var i = 0; i < value.length; i++) {
                var contact = value[i];
                contact.body1.translate(contact.normal.scale(contact.penetration * inverseLength * contact.penetration / allMap.get(contact.body1.id).penetrationSum));
            }
        }
        this.contacts.length = 0;
    }

    handleSphereSphere(sphere1, sphere2) {
        if (sphere1.maxParent == sphere2.maxParent) {
            return false;
        }
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
        var normal = new Vector3(0, 0, 0);
        var height1 = triangle.getHeight(heightmapPosPrev);
        var height2 = triangle.getHeight(heightmapPosPrev);
        // if(1==0 && heightmapPos.y > height1.y && heightmapPosPrev.y > height2.y){

        //     top = true;
        // }
        // else if(1==0 && heightmapPos.y < height1.y && heightmapPosPrev.y < height2.y){
        //     top = false;
        // }
        // else{
        //     var triangle2 = triangle.copy();
        //     triangle2.a = terrain1.translateHeightmapToWorld(triangle2.a);
        //     triangle2.b = terrain1.translateHeightmapToWorld(triangle2.b);
        //     triangle2.c = terrain1.translateHeightmapToWorld(triangle2.c);

        //     var velocity = point1.global.body.getVelocity();//pointPos.subtract(p);
        //     normal = triangle2.getNormal();
        //     var pointVelocity = velocity.dot(normal);
        //     if(pointVelocity > 0){
        //         //top = false;
        //     }
        // }

        if (top) {
            var height = terrain1.translateHeightmapToWorld(triangleTop.getHeight(heightmapPos));
            var triangle2 = triangle.copy();
            triangle2.a = terrain1.translateHeightmapToWorld(triangle2.a);
            triangle2.b = terrain1.translateHeightmapToWorld(triangle2.b);
            triangle2.c = terrain1.translateHeightmapToWorld(triangle2.c);
            var normal = triangle2.getNormal();

            var contact = new Contact();
            contact.normal = normal;
            //contact.penetration = (new Vector3(0, height.y - pointPos.y, 0)).dot(contact.normal);
            contact.penetration = triangle2.a.subtract(pointPos).dot(contact.normal);
            if (contact.penetration < 0) {
                return false;
            }
            contact.body1 = point1;
            contact.body2 = terrain1;
            contact.point = point1.global.body.position;
            contact.velocity = point1.getVelocityAtPosition(contact.point).subtractInPlace(terrain1.getVelocityAtPosition(contact.point));
            return contact;
        }
        else {
            var height = terrain1.translateHeightmapToWorld(triangleBottom.getHeight(heightmapPos));
            if (pointPos.y > height.y) {
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