var Random = (typeof (Random) != "undefined") ? Random : require("./Random");
var Range = (typeof (Range) != "undefined") ? Range : require("./Range");
var Vector2 = (typeof (Vector2) != "undefined") ? Vector2 : require("./Vector2");
var SerializeJSON = (typeof (SerializeJSON) != "undefined") ? SerializeJSON : require("./SerializeJSON");

var Stepper = class {
    constructor(initialize = true) {
        this.randomSeed = [];
        this.random = function () { };
        this.inputs = {};

        this.static = {};
        this.static.playerinfo = {};

        this.world = {};
        this.players = {};

        if (initialize) {
            this.initialize();
        }
    }

    initialize() {
        this.randomSeed = Random.randomBuffer32Bit(4);
        this.random = Random.getRandomFunctionFrom128BitSeed(...this.randomSeed);
        this.inputs = {};
        this.static = {};
        this.static.playerinfo = {};
        this.world = {};
    }

    createPlayer() {
        var player = {};
        return player;
    }

    addPlayer(id) {
        this.players[id] = this.createPlayer();
    }

    deletePlayer(id) {
        this.killPlayer(id);
        delete this.players[id];
    }

    toJSON() {
        return {
            randomSeed: this.randomSeed,
            inputs: this.inputs,

            players: this.players,
            world: this.world
        }
    }

    fromJSON(jsondata) {
        var s = new Stepper(false);
        s.randomSeed = jsondata.randomSeed;
        s.random = function () { }
        s.static = this.static;
        s.inputs = jsondata.inputs;

        s.players = jsondata.players;
        s.world = jsondata.world;
        s.random = Random.getRandomFunctionFrom128BitSeed(...s.randomSeed);
        return s;
    }

    updateRandomGenerator() {
        this.randomSeed = Random.nextSeed(this.randomSeed);
        this.random = Random.getRandomFunctionFrom128BitSeed(...this.randomSeed);
    }

    serialize() {
        return SerializeJSON.serialize(SerializeJSON.deepclone(this.toJSON()));
    }

    fromSerialized(data) {
        return this.fromJSON(SerializeJSON.deserialize(data)).copy();
    }

    copy() {
        return this.fromJSON(SerializeJSON.deepclone(this.toJSON()));
    }

    updateInputs(inputs) {
        for (var id in this.players) {
            if (inputs[id]) {
                this.inputs[id] = [...inputs[id]];
            }
            else {
                if (!this.inputs[id]) {
                    this.inputs[id] = [0, 0, 0];
                }
            }
        }
    }

    step(inputs) {

    }

    interpolateWith(step, dt, extra) {

    }

    draw(context, extra) {

    }
}

if (typeof (module) != "undefined") {
    module.exports = Stepper;
}