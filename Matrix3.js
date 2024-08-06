var Vector3 = (typeof (Vector3) != "undefined") ? Vector3 : require("./Vector3");

var Matrix3 = class {

    constructor(options) {
        this.elements = options?.elements ?? [1, 0, 0, 0, 1, 0, 0, 0, 1];
    }

    add(m) {
        var result = new Matrix3();
        result.elements = [
            this.elements[0] + m.elements[0],
            this.elements[1] + m.elements[1],
            this.elements[2] + m.elements[2],
            this.elements[3] + m.elements[3],
            this.elements[4] + m.elements[4],
            this.elements[5] + m.elements[5],
            this.elements[6] + m.elements[6],
            this.elements[7] + m.elements[7],
            this.elements[8] + m.elements[8],
        ];
        return result;
    }

    addInPlace(m) {
        this.elements[0] += m.elements[0];
        this.elements[1] += m.elements[1];
        this.elements[2] += m.elements[2];
        this.elements[3] += m.elements[3];
        this.elements[4] += m.elements[4];
        this.elements[5] += m.elements[5];
        this.elements[6] += m.elements[6];
        this.elements[7] += m.elements[7];
        this.elements[8] += m.elements[8];
        return this;
    }

    multiplyVector3(v) {
        var result = new Vector3();
        result.x = this.elements[0] * v.x + this.elements[3] * v.y + this.elements[6] * v.z;
        result.y = this.elements[1] * v.x + this.elements[4] * v.y + this.elements[7] * v.z;
        result.z = this.elements[2] * v.x + this.elements[5] * v.y + this.elements[8] * v.z;
        return result;
    }

    multiply(m) {
        m = m.elements;
        var result = new Matrix3();
        result.elements = [
            this.elements[0] * m[0] + this.elements[3] * m[1] + this.elements[6] * m[2],
            this.elements[1] * m[0] + this.elements[4] * m[1] + this.elements[7] * m[2],
            this.elements[2] * m[0] + this.elements[5] * m[1] + this.elements[8] * m[2],
            this.elements[0] * m[3] + this.elements[3] * m[4] + this.elements[6] * m[5],
            this.elements[1] * m[3] + this.elements[4] * m[4] + this.elements[7] * m[5],
            this.elements[2] * m[3] + this.elements[5] * m[4] + this.elements[8] * m[5],
            this.elements[0] * m[6] + this.elements[3] * m[7] + this.elements[6] * m[8],
            this.elements[1] * m[6] + this.elements[4] * m[7] + this.elements[7] * m[8],
            this.elements[2] * m[6] + this.elements[5] * m[7] + this.elements[8] * m[8]
        ];

        return result;
    }

    multiplyInPlace(m) {
        this.elements = this.multiply(m).elements;
        return this;
    }

    invert() {
        var result = new Matrix3();
        var determinant = this.elements[0] * (this.elements[4] * this.elements[8] - this.elements[5] * this.elements[7]) - this.elements[1] * (this.elements[3] * this.elements[8] - this.elements[5] * this.elements[6]) + this.elements[2] * (this.elements[3] * this.elements[7] - this.elements[4] * this.elements[6]);

        if (determinant == 0) {
            return result;
        }

        result.elements = [
            (this.elements[4] * this.elements[8] - this.elements[5] * this.elements[7]) / determinant,
            (this.elements[2] * this.elements[7] - this.elements[1] * this.elements[8]) / determinant,
            (this.elements[1] * this.elements[5] - this.elements[2] * this.elements[4]) / determinant,
            (this.elements[5] * this.elements[6] - this.elements[3] * this.elements[8]) / determinant,
            (this.elements[0] * this.elements[8] - this.elements[2] * this.elements[6]) / determinant,
            (this.elements[2] * this.elements[3] - this.elements[0] * this.elements[5]) / determinant,
            (this.elements[3] * this.elements[7] - this.elements[4] * this.elements[6]) / determinant,
            (this.elements[1] * this.elements[6] - this.elements[0] * this.elements[7]) / determinant,
            (this.elements[0] * this.elements[4] - this.elements[1] * this.elements[3]) / determinant
        ];

        return result;
    }

    invertInPlace() {
        var determinant = this.elements[0] * (this.elements[4] * this.elements[8] - this.elements[5] * this.elements[7]) - this.elements[1] * (this.elements[3] * this.elements[8] - this.elements[5] * this.elements[6]) + this.elements[2] * (this.elements[3] * this.elements[7] - this.elements[4] * this.elements[6]);

        if (determinant == 0) {
            return this;
        }

        var temp = this.elements[1];
        this.elements[1] = this.elements[3];
        this.elements[3] = temp;
        temp = this.elements[2];
        this.elements[2] = this.elements[6];
        this.elements[6] = temp;
        temp = this.elements[5];
        this.elements[5] = this.elements[7];
        this.elements[7] = temp;

        this.elements[0] = (this.elements[4] * this.elements[8] - this.elements[5] * this.elements[7]) / determinant;
        this.elements[1] = (this.elements[2] * this.elements[7] - this.elements[1] * this.elements[8]) / determinant;
        this.elements[2] = (this.elements[1] * this.elements[5] - this.elements[2] * this.elements[4]) / determinant;
        this.elements[3] = (this.elements[5] * this.elements[6] - this.elements[3] * this.elements[8]) / determinant;
        this.elements[4] = (this.elements[0] * this.elements[8] - this.elements[2] * this.elements[6]) / determinant;
        this.elements[5] = (this.elements[2] * this.elements[3] - this.elements[0] * this.elements[5]) / determinant;
        this.elements[6] = (this.elements[3] * this.elements[7] - this.elements[4] * this.elements[6]) / determinant;
        this.elements[7] = (this.elements[1] * this.elements[6] - this.elements[0] * this.elements[7]) / determinant;
        this.elements[8] = (this.elements[0] * this.elements[4] - this.elements[1] * this.elements[3]) / determinant;

        return this;
    }

    transpose() {
        var result = new Matrix3();
        for (var i = 0; i < 3; i++) {
            for (var j = 0; j < 3; j++) {
                result.set(i, j, this.get(j, i));
            }
        }
        return result;
    }

    transposeInPlace() {
        var temp;
        temp = this.elements[1];
        this.elements[1] = this.elements[3];
        this.elements[3] = temp;
        temp = this.elements[2];
        this.elements[2] = this.elements[6];
        this.elements[6] = temp;
        temp = this.elements[5];
        this.elements[5] = this.elements[7];
        this.elements[7] = temp;
        
        temp = this.elements[3];
        this.elements[3] = this.elements[1];
        this.elements[1] = temp;
        temp = this.elements[6];
        this.elements[6] = this.elements[2];
        this.elements[2] = temp;
        temp = this.elements[7];
        this.elements[7] = this.elements[5];
        this.elements[5] = temp;
        
        return this;
    }

    get(row, column) {
        return this.elements[row * 3 + column];
    }

    set(row, column, value) {
        this.elements[row * 3 + column] = value;
    }

    setMatrix3(m) {
        this.elements = [...m.elements];
    }

    copy() {
        return new this.constructor(this);
    }

    reset() {
        this.elements = [1, 0, 0, 0, 1, 0, 0, 0, 1];
    }

    static identity() {
        return new Matrix3({ elements: [1, 0, 0, 0, 1, 0, 0, 0, 1] });
    }

    static zero(){
        return new Matrix3({ elements: [0, 0, 0, 0, 0, 0, 0, 0, 0] });
    }

    static from(elements) {
        return new this({ elements: elements });
    }

    static from2dArray(elements) {
        return new this({ elements: elements.flat() });
    }

    to2dArray() {
        var array = [];
        for (var i = 0; i < 3; i++) {
            array.push(this.elements.slice(i * 3, i * 3 + 3));
        }
        return array;
    }
}


if (typeof (module) != "undefined") {
    module.exports = Matrix3;
}
