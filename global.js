import { Component, ComputeComponent, ConnectorNode } from "./component.js"
import { Transform } from "./engine.js"
import { Shape } from "./shape.js"

const green = "#29D827"
const blue = "#2729D8"
const red = "#D82729"

/**
 * @param {number} id 
 * @param {number} inCount Number of component inputs.
 * @param {number} outCount Number of component outputs.
 * @param {string} svgModel The inner data of the svg model.
 * @param {(i: ConnectorNode[], o: ConnectorNode[])} behaviour The behaviour of the component.
 * @param {function} onClick The onClick.
 */
function createGateComponent(id, inCount, outCount, svgModel, behaviour, onClick = undefined) {
    const component = new ComputeComponent(inCount, outCount, svgModel, behaviour, {
        enabled: false,
        onClick,
        id
    })
    return component
}

/// ---- NOT GATE ----
const notSvg = `<line x1="0" y1="16" x2="16" y2="16" stroke="black" stroke-width="2" fill="none"/>
<line x1="16" y1="0" x2="16" y2="32" stroke="black" stroke-width="2" fill="none"/>
<line x1="16" y1="0" x2="48" y2="16" stroke="black" stroke-width="2" fill="none"/>
<line x1="48" y1="16" x2="16" y2="32" stroke="black" stroke-width="2" fill="none"/>
<circle cx="64" cy="16" r="16" stroke="black" stroke-width="2" fill="none"/>
<line x1="80" y1="16" x2="96" y2="16" stroke="black" stroke-width="2" fill="none"/>
<circle cx="0" cy="16" r="2" class="input" stroke="${green}" stroke-width="2" fill="none"/>
<circle cx="96" cy="16" r="2" class="output" stroke="${blue}" stroke-width="2" fill="none"/>`
const notModel = new Shape(notSvg)
const notGate = createGateComponent(1,
    [new ConnectorNode('input', {transform: new Transform({ x: 0, y: 16 })})],
    [new ConnectorNode('output', {transform: new Transform({ x: 96, y: 16 })})],
    notModel, (i, o) => { o[0].value = !i[0].value },
)

/// ---- AND GATE ----
const andSvg = `<line x1="16" y1="16" x2="0" y2="16" stroke="black" stroke-width="2" fill="none"/>
<line x1="16" y1="48" x2="0" y2="48" stroke="black" stroke-width="2" fill="none"/>
<path d="M 16 0 A 32 32 0 0 1 16 64" stroke="black" stroke-width="2" fill="none"/>
<line x1="48" y1="32" x2="64" y2="32" stroke="black" stroke-width="2" fill="none"/>
<line x1="16" y1="0" x2="16" y2="64" stroke="black" stroke-width="2" fill="none"/>
<circle cx="0" cy="16" r="2" class="input" stroke="${green}" stroke-width="2" fill="none"/>
<circle cx="0" cy="48" r="2" class="input" stroke="${green}" stroke-width="2" fill="none"/>
<circle cx="64" cy="32" r="2" class="output" stroke="${blue}" stroke-width="2" fill="none"/>`
const andShape = new Shape(andSvg)
const andGate = createGateComponent(2,
    [new ConnectorNode('input', {transform: new Transform({ x: 0, y: 16 })}),
    new ConnectorNode('input', {transform: new Transform({ x: 0, y: 48 })})],
    [new ConnectorNode('output', {transform: new Transform({ x: 64, y: 32 })})],
    andShape, (i, o) => { o[0].value = i[0].value && i[1].value },
)

/// ---- NAND GATE ----
const nandSvg = `<line x1="16" y1="16" x2="0" y2="16" stroke="black" stroke-width="2" fill="none"/>
<line x1="16" y1="48" x2="0" y2="48" stroke="black" stroke-width="2" fill="none"/>
<line x1="16" y1="0" x2="16" y2="64" stroke="black" stroke-width="2" fill="none"/>
<path d="M 16 0 A 32 32 0 0 1 16 64" stroke="black" stroke-width="2" fill="none"/>
<circle cx="64" cy="32" r="16" stroke="black" stroke-width="2" fill="none"/>
<line x1="96" y1="32" x2="80" y2="32" stroke="black" stroke-width="2" fill="none"/>`
const nandShape = new Shape(nandSvg)
const nandGate = createGateComponent(3,
    [new ConnectorNode('input', {transform: new Transform({ x: 0, y: 16 })}),
    new ConnectorNode('input', {transform: new Transform({ x: 0, y: 48 })})],
    [new ConnectorNode('output', {transform: new Transform({ x: 96, y: 32 })})],
    nandShape, (i, o) => { o[0].value = !(i[0].value && i[1].value) },
)

/// ---- INPUT COMPONENT ----
const inputSwitchSvg = `<circle cx="16" cy="16" r="16" stroke="black" stroke-width="2" fill="${red}"/>
<line x1="32" y1="16" x2="48" y2="16" stroke="black" stroke-width="2" fill="none"/>`
const inputSwitchModel = new Shape(inputSwitchSvg)
const inputSwitch = createGateComponent(4, 
    [], [new ConnectorNode('output', {transform: new Transform({ x: 48, y: 16 })})],
    inputSwitchModel, () => {},
    function (e) {
        this.outputs[0].value = !this.outputs[0].value
        const circle = this.model.svg.querySelector('circle');
        if (circle) {
            circle.setAttribute('fill', this.outputs[0].value ? green : red);
        }
    }
)

/// ---- OUT COMPONENT ----
const outputLedSvg = `<line x1="16" y1="16" x2="0" y2="16" stroke="black" stroke-width="2" fill="${red}"/>
<circle cx="32" cy="16" r="16" stroke="black" stroke-width="2" fill="none"/>`
const outputLedModel = new Shape(outputLedSvg)
const outLed = createGateComponent(5,
    [new ConnectorNode('input', {transform: new Transform({ x: 0, y: 16 })})], [],
    outputLedModel,
    function (i, o) {
        const circle = this.model.svg.querySelector('circle');
        if (circle) {
            this.model.svg.querySelector('circle').setAttribute('fill', this.inputs[0].value ? green : red);
        }
    },
)

// ---- COMPONENT LIST ---- 
const componentLookup = new Map()
componentLookup.set(outLed.id, outLed)
componentLookup.set(inputSwitch.id, inputSwitch)
componentLookup.set(notGate.id, notGate)
componentLookup.set(andGate.id, andGate)
componentLookup.set(nandGate.id, nandGate)

const globals = {
    GRID: {
        SIZE: 16
    },
    SCREEN: {
        X_OFFSET: 0,
        Y_OFFSET: 0,
    },
    COLORS: {
        GREEN: green,
        BLUE: blue,
        RED: red
    },
    components: {
        outputs: {
            led: outLed
        },
        inputs: {
            switch: inputSwitch
        },
        gates: {
            not: notGate,
            and: andGate,
            nanad: nandGate,     
        },
        /**
         * @param {number} id 
         * @returns {Component}
         */
        fromId: function(id) {
            return componentLookup[id].clone()
        }
    }
}

export default globals