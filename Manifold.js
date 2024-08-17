var Vector3 = (typeof (Vector3) != "undefined") ? Vector3 : require("./Vector3");

var Manifold = class {
    constructor(options) {
        this.body1 = options?.body1 ?? null;
        this.body2 = options?.body2 ?? null;
        this.contacts = options?.contacts ?? [];
    }

    addContact(contact) {
        this.contacts.push(contact);
    }

    clearContacts() {
        this.contacts = [];
    }
}