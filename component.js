import { Cloneable, ScreenObject, Transform } from "./engine.js";
import globals from "./global.js";
import { Shape } from "./shape.js";
import utils from "./utils.js";

const connectorNodes = new Set()
const components = new Set()

function isInNode(x, y) {
    for (const n of connectorNodes) {
        if (6 * 6 >= (n.transform.globalx - x) ** 2 + (n.transform.globaly - y) ** 2) {
            return n
        }
    }
    return undefined
}

function isInComponent(x, y) {
    for (const c of components) {
        const bounds = c.getPositionSize()

        if (bounds && utils.math.isPointInsideRect(x, y, bounds)) {
            return c
        }
    }
    return undefined
}

function getAllComponents() {
    const result = [...components];

    result.sort((a, b) => {
        return a.inputs.length - b.inputs.length;
    });

    return result;
}

/**
 * @typedef {'input' | 'output'} ConnectorType
 */
class ConnectorNode extends ScreenObject {
    /**
     * @param {ConnectorType} type 
     */
    constructor(type, { transform = new Transform(), enabled = true, onClick } = {}) {
        super({ transform, enabled, onClick })
        this.type = type
        this._value = false

        /**
         * @type {ConnectorNode[]}
         */
        this.nextNodes = []
    }

    set value(v) {
        this._value = v
        for (const n of this.nextNodes) {
            n.value = v
        }
    }

    get value() { return this._value; }

    disable() {
        connectorNodes.delete(this)
    }

    enable() {
        connectorNodes.add(this)
    }

    toJSON() {
        return { type: this.type, transform: this.transform.toJSON() }
    }

    static fromJSON(data) {
        return new ConnectorNode(data.type, { transform: Transform.fromJSON(data.transform) })
    }
}

class Component extends ScreenObject {
    /**
     * The base component object, iherit this class.
     * @param {ConnectorNode[]} inputs The input nodes (relative to the model cords)
     * @param {ConnectorNode[]} outputs The output nodes (relative to the model cords)
     * @param {Shape} model The model of this component.
     * @param {(i: ConnectorNode[], o: ConnectorNode[])} operation The operation this gate will preform.
     */
    constructor(inputs, outputs, model, operation, { transform, enabled, onClick } = {}) {
        super({ transform, enabled, onClick })
        this.model = model
        this.inputs = inputs
        this.outputs = outputs
        this.operation = operation

        this.bounds = undefined
        this.nextComponents = []

        for (const e of this.inputs) {
            e.attachToObject(this)
        }
        for (const e of this.outputs) {
            e.attachToObject(this)
        }
        this.model.attachToObject(this)

        this.finishConstruct()
    }

    onTransformUpdate() {
        super.onTransformUpdate()

        // Update model to middle of the shape
        if (!this.bounds) {
            this.bounds = this.model.getPositionSize()
            if (this.bounds) {
                const grid = globals.GRID.SIZE;
                const ox = (this.bounds.width / 2 / grid).toFixed() * grid
                const oy = (this.bounds.height / 2 / grid).toFixed() * grid
                this.transform.setLocalOffset(-Math.round(ox), -Math.round(oy))
            }
        }
    }

    getPositionSize() {
        return {
            x: this.bounds.x + this.transform.globalx,
            y: this.bounds.y + this.transform.globaly,
            width: this.bounds.width,
            height: this.bounds.height
        }
    }

    disable() {
        components.delete(this)
        for (const e of this.inputs) {
            e.disable();
        }
        for (const e of this.outputs) {
            e.disable();
        }
    }

    simulate() {
        this.operation(this.inputs, this.outputs)
    }

    enable() {
        components.add(this)
        for (const e of this.inputs) {
            e.enable();
        }
        for (const e of this.outputs) {
            e.enable();
        }
    }

    toJSON() {
        throw new Error("This class (Component) should be used only for inheritance.")
    }

    static fromJSON(data) {
        throw new Error("This class (Component) should be used only for inheritance.")
    }
}

class ComputeComponent extends Component {
    /**
     * Componnet that will calculate the output 
     * of the outputs based on some function.
     * @param {ConnectorNode[]} inputs The input nodes (relative to the model cords)
     * @param {ConnectorNode[]} outputs The output nodes (relative to the model cords)
     * @param {(i: ConnectorNode[], o: ConnectorNode[])} operation The operation this gate will preform.
     * @param {Shape} model The model of this component.
     */
    constructor(inputs, outputs, model, operation, { transform, enabled, onClick, id } = {}) {
        super(inputs, outputs, model, operation, { transform, enabled, onClick })
        this.id = id
    }

    toBin() {
        const arr = new Uint8Array(5); // id(1), x(2), y(2)
        const x = this.transform.localx + 32768;
        const y = this.transform.localy + 32768;
        
        arr[0] = this.id & 0xff;
        arr[1] = (x >> 8) & 0xff;
        arr[2] = x & 0xff;
        arr[3] = (y >> 8) & 0xff; 
        arr[4] = y & 0xff;
        return arr;
    }

    toJSON() {
        return {
            inputs: this.inputs.map((e) => e.toJSON()),
            outputs: this.outputs.map((e) => e.toJSON()),
            model: this.model.toJSON(),
            operation: this.operation,
            transform: this.transform.toJSON(),
            onClick: this.onClick
        }
    }

    static fromBin(arr) {
        const id = arr[0]
        const x = (arr[1] << 8) + arr[2] - 32768 
        const y = (arr[3] << 8) + arr[4] - 32768

        const copy = globals.components.fromId(id)
        copy.transform.setPosition(x, y)
        return copy
    }

    static fromJSON(data) {
        const inputs = data.inputs.map(ConnectorNode.fromJSON);
        const outputs = data.outputs.map(ConnectorNode.fromJSON);
        const model = Shape.fromJSON(data.model);
        const transform = Transform.fromJSON(data.transform);
        return new ComputeComponent(inputs, outputs, model, data.operation, { transform: transform, onClick: data.onClick })
    }
}

export {
    ConnectorNode,
    Component,
    ComputeComponent,
}

export default {
    isInNode,
    isInComponent,
    getAllComponents
}