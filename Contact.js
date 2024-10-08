var Vector3 = (typeof (Vector3) != "undefined") ? Vector3 : require("./Vector3");



var Contact = class {
    constructor(options) {

        this.shared = {};

        this.shared.solved = options?.shared?.solved ?? false;
        this.shared.impulse = Vector3.from(options?.shared?.impulse);

        this.normal = Vector3.from(options?.normal);
        this.penetration = options?.penetration ?? 0;

        this.body1 = options?.body1;
        this.body2 = options?.body2;
        
        this.point = Vector3.from(options?.point);
        this.velocity = Vector3.from(options?.velocity);

        this.combinedMaterial = options?.combinedMaterial ?? null;
    }

    copy(){
        var c = new Contact();
        c.normal = this.normal.copy();
        c.penetration = this.penetration;

        c.body1 = this.body1;
        c.body2 = this.body2;
        c.point = this.point;
        c.velocity = this.velocity;
        c.shared = this.shared;

        c.combinedMaterial = this.combinedMaterial;
        return c;
    }
};


if (typeof (module) != "undefined") {
    module.exports = Contact;
}