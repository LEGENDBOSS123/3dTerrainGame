var Vector3 = (typeof (Vector3) != "undefined") ? Vector3 : require("./Vector3");



var Contact = class {
    constructor(options) {
        this.normal = options?.normal;
        this.penetration = options?.penetration;

        this.body1 = options?.body1;
        this.body2 = options?.body2;
        
        this.point = options?.contactPoint;
        this.velocity = options?.contactVelocity;
    }
};


if (typeof (module) != "undefined") {
    module.exports = Contact;
}