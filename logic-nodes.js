import { TruthTableComponent } from "./component.js"
import utils from "./utils.js"

export class LogicNode {
    /**
     * Evaluate the value of the 'circuit' and return it.
     * @param {Set<LogicGateNode>} [visited=new Set()] Keeps track of all visited nodes to prevent Stackoverflow
     * @returns {boolean} 
     */
    evaluate(visited = new Set()) {
        visited.add(this)
    }
}

export class TruthTableNode extends LogicNode {
    /**
     * @param {TruthTableComponent} component 
     */
    constructor(component) {
        super()
        this.component = component;
    }

    evaluate(visited = new Set()) {
        if (visited.has(this)) return this.value
        super.evaluate(visited)
        
        for (const [inp, out] of this.component.table) {
            if(utils.arraysEqual(inp, inputs)) return true
        }
        return false
    }
}

export class LogicGateNode extends LogicNode {
    /**
     * @param {LogicNode | boolean} operation 
     * @param {boolean | undefined} value 
     * @param {LogicNode | undefined} left 
     * @param {LogicNode | undefined} right 
     */
    constructor(operation, value=false, left, right) {
        super()
        this.operation = operation
        this.value = value
        this.left = left
        this.right = right
    }

    evaluate(visited = new Set()) {
        if (visited.has(this)) return this.value
        super.evaluate(visited)

        if (this.operation === "+") {
            this.value = this.left.evaluate(visited) || this.right.evaluate(visited)
        }
        if (this.operation === "*") {
            this.value = this.left.evaluate(visited) && this.right.evaluate(visited)
        }
        if (this.operation === "n+") {
            this.value = !(this.left.evaluate(visited) || this.right.evaluate(visited))
        }
        if (this.operation === "n*") {
            this.value = !this.left.evaluate(visited) || !this.right.evaluate(visited)
        }
        if (this.operation === "x") {
            this.value = this.left.evaluate(visited) !== this.right.evaluate(visited)
        }
        if (this.operation === "x*") {
            this.value = this.left.evaluate(visited) === !this.right.evaluate(visited)
        }

        return this.value
    }
}

export class LogicInputNode extends LogicNode {
    constructor(value) {
        super()
        this.value = value
    }

    evaluate(visited = new Set()) {
        return this.value
    }
}


