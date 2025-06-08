import utils from "./utils.js"    

/**
 * Extend a class to make it cloneable.
 */
export class Cloneable {
    clone() {
        return this.constructor.fromJSON(this.toJSON());
    }

    toJSON() {
        throw new Error("toJSON() not implemented");
    }

    static fromJSON(data) {
        throw new Error("fromJSON() not implemented");
    }

}

export class Transform extends Cloneable {
    constructor({x, y}={x:0, y:0}) {
        super()
        this.localx = x
        this.localy = y
        this.localOffsetx = 0
        this.localOffsety = 0
        /**
         * @type {Transform}
         */
        this.parent = undefined
        this.objects = new Set()
    }

    setPosition(newx, newy) {
        this.localx = newx
        this.localy = newy

        for (const obj of this.objects) {
            if(obj.onTransformUpdate) {
                obj.onTransformUpdate(this)
            }
        }
    }

    setLocalOffset(x, y) {
        this.localOffsetx = x
        this.localOffsety = y
    }
    
    get globalx() {
        return (this.parent?.globalx ?? 0) + 
            this.localOffsetx + this.localx
    }

    get globaly() {
        return (this.parent?.globaly ?? 0) +
            this.localOffsety + this.localy
    }

    attachObject(obj) {
        this.objects.add(obj)
    }

    detachObject(obj) {
        this.objects.delete(obj)
    }

    setParent(parent) {
        if (parent && this.parent) {
            throw new Error("Component already has parent.")
        }

        this.parent = parent
    }

    toJSON() {
        return {x: this.localx, y: this.localy}
    }

    static fromJSON(data) {
        return new Transform({x: data.x, y: data.y})
    }
}

export class ScreenObject extends Cloneable {
    constructor({transform=new Transform(), enabled=true, onClick}={}) {
        super()
        this.transform = transform;
        this.transform.attachObject(this)
        this.enabled = enabled
        /**
         * @type {Set<ScreenObject>}
         */
        this.children = new Set()
        this.parent = undefined

        this.onClick = onClick
    }

    finishConstruct() {
        if(this.enabled) this.enable();
        else this.disable();
    }

    attachToObject(parent) {
        this.parent = parent
        parent.#addChild(this)
        this.transform.setParent(parent.transform)
    }

    detachFromObject(parent) {
        this.parent = undefined
        parent.#removeChild(parent)
        this.transform.setParent(undefined)
    }

    #addChild(obj) {
        this.children.add(obj)
    }

    #removeChild(obj) {
        this.children.delete(obj)
    }

    disable() {
        
    }

    enable() {

    }

    getPositionSize() {
        return {
            x: 0, y: 0,
            width: 0, height: 0
        }
    }

    onTransformUpdate() {
        for (const child of this.children) {
            child.onTransformUpdate()
        }
    }

    toJSON() {
        return {transform: this.transform.toJSON()}
    }

    toBin() {
        throw new Error("Not implemented.")
    }

    clone() {
        return this.constructor.fromJSON(this.toJSON());
    }

    static fromBin(arr) {
        throw new Error("Not implemented.")
    }

    static fromJSON(data) {
        return new ScreenObject(Transform.fromJSON(data.transform))
    }
}