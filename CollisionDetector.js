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

    addContact(contact) {
        this.contacts.push(contact);
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
        if(shape1.maxParent == shape2.maxParent) {
            return false;
        }
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
            this.detectCollision(value[0], value[1]);
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
            var contact2 = contact.copy();
            var temp = contact.body1;
            contact2.body1 = contact.body2;
            contact2.body2 = temp;
            contact2.velocity.scaleInPlace(-1);
            contact2.normal.scaleInPlace(-1);
            contact2.point = contact.point.copy();

            maxParentMap.get(contact.body1.maxParent.id).push(contact);
            maxParentMap.get(contact.body2.maxParent.id).push(contact2);
            // allMap.get(contact.body1.id).contacts.push(contact);
            // allMap.get(contact.body1.id).penetrationSum += contact.penetration;
            // allMap.get(contact.body2.id).contacts.push(contact2);
            // allMap.get(contact.body2.id).penetrationSum += contact2.penetration;
        }


        for (var [key, value] of maxParentMap) {
            var inverseLength = 1 / value.length;
            var totalImpulse = 0;
            for (var i = 0; i < value.length; i++) {
                var contact = value[i];
                
                var impactSpeed = contact.velocity.dot(contact.normal);
                var force = new Vector3();

                var restitution = 0;
                var radius1 = contact.point.subtract(contact.body1.maxParent.global.body.position);
                var radius2 = contact.point.subtract(contact.body2.maxParent.global.body.position);

                var rotationalEffects1 = contact.normal.dot(contact.body1.maxParent.global.body.inverseMomentOfInertia.multiplyVector3(radius1.cross(contact.normal)).cross(radius1));
                var rotationalEffects2 = contact.normal.dot(contact.body2.maxParent.global.body.inverseMomentOfInertia.multiplyVector3(radius2.cross(contact.normal)).cross(radius2));
                rotationalEffects1 = isFinite(rotationalEffects1) ? rotationalEffects1 : 0;
                rotationalEffects2 = isFinite(rotationalEffects2) ? rotationalEffects2 : 0;
                var denominator = contact.body1.maxParent.global.body.inverseMass + rotationalEffects1;
                denominator += contact.body2.maxParent.global.body.inverseMass + rotationalEffects2;
                
                var impulse = - (1 + restitution) * impactSpeed / denominator;
                if (impulse < 0) {
                    impulse = 0;
                }
                var penetrationForce = (Math.min(this.constructor.penetrationCoefficient * contact.penetration + this.constructor.penetrationDamping * impactSpeed, this.constructor.penetrationMax)) * contact.body1.local.body.mass;
                //impulse += penetrationForce;
                var tangential = contact.velocity.projectOntoPlane(contact.normal);
                var maxFriction = tangential.magnitude() / denominator * 0.5;
                tangential.normalizeInPlace();
                var friction = impulse *0;
                force.addInPlace(tangential.scale(-1 * Math.max(0, Math.min(maxFriction, friction))));
                force.addInPlace(contact.normal.scale(impulse));
                
                contact.body1.applyForce(force.scale(inverseLength), contact.point);
                //contact.body2.applyForce(force.scale(-1 * inverseLength), contact.point);
                if(contact.body1.maxParent == player){
                    //console.log(impulse * inverseLength);
                    totalImpulse += impulse * inverseLength;
                    top.grounded = true;
                }
            }
            //console.log(key, totalImpulse)
        }
        for (var [key, value] of maxParentMap) {
            var inverseLength = 1 / value.length;
            var totalTranslation = new Vector3();
            for (var i = 0; i < value.length; i++) {
                var contact = value[i];
                var translation = contact.normal.scale(contact.penetration)
                var totalMass = contact.body1.maxParent.global.body.mass + contact.body2.maxParent.global.body.mass;
                var massRatio2 = contact.body2.maxParent.global.body.mass / totalMass;
                massRatio2 = isNaN(massRatio2)?1:massRatio2;
                totalTranslation.addInPlace(translation.scale(inverseLength * massRatio2));
            }
            contact.body1.translate(totalTranslation);
        }
        this.contacts.length = 0;
    }

    handleSphereSphere(sphere1, sphere2) {
        var distanceTo = sphere1.global.body.position.distance(sphere2.global.body.position);
        if (distanceTo > sphere1.radius + sphere2.radius) {
            return false;
        }

        var contact = new Contact();
        contact.point = sphere1.global.body.position.add(sphere2.global.body.position).scale(0.5);
        contact.velocity = sphere1.getVelocityAtPosition(contact.point).subtractInPlace(sphere2.getVelocityAtPosition(contact.point));
        contact.normal = sphere1.global.body.position.subtract(sphere2.global.body.position).normalizeInPlace();
        if(contact.normal.magnitudeSquared() == 0){
            contact.normal = new Vector3(1, 0, 0);
        }

        contact.body1 = sphere1;
        contact.body2 = sphere2;
        contact.penetration = sphere1.radius + sphere2.radius - distanceTo;
        this.addContact(contact);
        return;
    }

    handleSphereTerrain(sphere1, terrain1) {
        this.handleTerrainPoint(terrain1, sphere1);
        return;
        var spherePos = sphere1.global.body.position;

        var spherePosPrev = sphere1.global.body.actualPreviousPosition;
        var translatedSpherePos = terrain1.translateWorldToLocal(spherePos);
        var heightmapPos = terrain1.translateLocalToHeightmap(translatedSpherePos);
        var translatedSpherePosPrev = terrain1.translateWorldToLocal(spherePosPrev);
        var heightmapPosPrev = terrain1.clampToHeightmap(terrain1.translateLocalToHeightmap(translatedSpherePosPrev));
        var heightmapSphereWidth = sphere1.radius * terrain1.inverseTerrainScale;

        if( heightmapPos.x <= -heightmapSphereWidth || heightmapPos.x >= terrain1.heightmaps.widthSegments + heightmapSphereWidth || heightmapPos.z <= -heightmapSphereWidth || heightmapPos.z >= terrain1.heightmaps.depthSegments + heightmapSphereWidth){
            return false;
        }

        var min = new Vector3(heightmapPos.x - heightmapSphereWidth, 0, heightmapPos.z - heightmapSphereWidth);
        var max = new Vector3(heightmapPos.x + heightmapSphereWidth, 0, heightmapPos.z + heightmapSphereWidth);
        var len = 0;
        for(var x = min.x - 1; x <= max.x + 1; x++){
            for(var z = min.z - 1; z <= max.z + 1; z++){
                var triangle = terrain1.getTriangle(terrain1.heightmaps.top, new Vector3(x, 0, z));
                if(!triangle){
                    continue;
                }
                triangle.a = terrain1.translateHeightmapToWorld(triangle.a);
                triangle.b = terrain1.translateHeightmapToWorld(triangle.b);
                triangle.c = terrain1.translateHeightmapToWorld(triangle.c);
                var intersection = triangle.intersectsSphere(spherePos, sphere1.radius);
                if(!intersection){
                    continue;
                }
                var contact = new Contact();
                contact.point = intersection;
                contact.normal = intersection.subtract(spherePos).normalizeInPlace();
                if(contact.normal.magnitudeSquared() == 0){ 
                    contact.normal = new Vector3(1, 0, 0);
                }
                contact.body1 = sphere1;
                contact.body2 = terrain1;
                contact.penetration = sphere1.radius - contact.point.distance(spherePos);
                if(contact.penetration < 0){
                    continue;
                }
                contact.velocity = sphere1.getVelocityAtPosition(contact.point).subtractInPlace(terrain1.getVelocityAtPosition(contact.point));
                this.addContact(contact);
                len++;
                if(len > 3){
                    return false;
                }
            }
        }
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

            this.addContact(contact);
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