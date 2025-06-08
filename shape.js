import { ScreenObject } from "./engine.js";
import utils from "./utils.js"

class Shape extends ScreenObject {
    /**
     * Create a new svg shape element. 
     * @param {SVGElement | string} svg 
     */
    constructor(svg, { transfrom } = {}) {
        super({ transfrom: transfrom })
        const svgIsString = utils.general.isString(svg)

        /**
         * @type {string}
         */
        this.svgText = svgIsString ? svg : svg.getHTML();

        /**
         * @type {SVGAElement}
         */
        this.svg = svgIsString ? utils.svg.createSvgFromText(svg) : svg.cloneNode(true);
    }

    getPositionSize() {
        const box = utils.svg.getBBoxIgnoringIO(this.svg)
        return (box && (box.width > 0 || box.height > 0)) ? box : undefined;
    }


    onTransformUpdate() {
        super.onTransformUpdate()
        this.svg.setAttribute('transform', `translate(${this.transform.globalx}, ${this.transform.globaly})`);
    }


    toJSON() {
        return { svg: this.svgText }
    }

    static fromJSON(data) {
        return new Shape(data.svg)
    }
}

export {
    Shape
}