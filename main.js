import canvas from "./canvas.js";
// import { ComputationalComponent } from "./component.js";
import globals from "./global.js";
import utils from "./utils.js";
import component from "./component.js";
import { Line } from "./line.js";


const svg = document.getElementById("canvas");

function convertToGrid(x, y) {
    const grid = globals.GRID.SIZE;
    return [Math.round(x / grid) * grid, Math.round(y / grid) * grid]
}

let line = undefined
let startconnector = undefined

// ----- Initilize canvas events -----
svg.addEventListener("mousedown", (e) => {
    const [x, y] = canvas.getGlobalMouse(e)
    const [gx, gy] = convertToGrid(x, y)
    if (e.button == 2) {
        if (line) {
            svg.removeChild(line.model.svg)
            line = undefined
        }
    }
    if (line) {
        line.addPoint({ x: gx, y: gy })
    }

    const n = component.isInNode(x, y)
    const c = component.isInComponent(x, y)
    if (n) {
        if (!line) {
            startconnector = n;
            line = new Line()
            line.addPoint({ x: gx, y: gy })
            svg.appendChild(line.model.svg);
        } else {
            if (n.type == 'input') {
                startconnector.parent.nextComponents.push(n.parent)
                startconnector.nextNodes.push(n)
            }
            else {
                n.parent.nextComponents.push(startconnector.parent)
                n.nextNodes.push(startconnector)
            }
            line = undefined;
        }
    }
    else if (currentComponent) {
        console.log(currentComponent.toBin());
        currentComponent = undefined
    }
    else if (c) {
        c.onClick?.(e)
    }
    else {
        canvas.startPanning(e)
    }
});

svg.addEventListener("contextmenu", (e) => {
    e.preventDefault(); // Disable the default context menu
});

svg.addEventListener("mousemove", (e) => {
    const [x, y] = canvas.getGlobalMouse(e)
    const [gx, gy] = convertToGrid(x, y)

    if (line) {
        line.addPoint({ x: gx, y: gy })
        line.removeLast()
    }
    else if (currentComponent) {
        currentComponent.transform.setPosition(gx, gy)
    }
    else {
        canvas.updatePanning(e)
    }
});

svg.addEventListener("mouseup", (e) => {
    canvas.stopPanning(e)
});

svg.addEventListener("mouseleave", (e) => {
    canvas.stopPanning(e)
});

svg.addEventListener("wheel", (e) => {
    e.preventDefault();
    canvas.updateZoom(e);
});

window.addEventListener("resize", () => {
    canvas.resizeCanvas()
});

canvas.initializeViewBox()

/**
 * @type {LogicComponent | undefined}
 */
let currentComponent = undefined
const onGateBtnClick = (args) => {
    currentComponent = args[0].clone()

    const canvas = document.getElementById("canvas")
    canvas.appendChild(currentComponent.model.svg)
}

utils.menu.createMenuDropdownButton("File", "Save", () => {
    const components = component.getAllComponents()
    var length = 2 + components.length * 8 * 5
    var index = 2
    
    const arr = new Uint8Array(length)
    arr.set([(length >> 8) & 0xff, length & 0xff])
    
    for (const c of components) {
        const temp = c.toBin()
        arr.set(temp, index);
        index += temp.length;
    }

    utils.file.downloadUint8Array(arr)
})

utils.menu.createMenuDropdownButton("In / Out", "Switch", onGateBtnClick, globals.components.inputs.switch)
utils.menu.createMenuDropdownButton("In / Out", "Led", onGateBtnClick, globals.components.outputs.led)

utils.menu.createMenuDropdownButton("Basic Gates", "Not", onGateBtnClick, globals.components.gates.not)
utils.menu.createMenuDropdownButton("Basic Gates", "And", onGateBtnClick, globals.components.gates.and)
utils.menu.createMenuDropdownButton("Basic Gates", "NAnd", onGateBtnClick, globals.components.gates.nanad)

let simRunning = false
let intervalId = undefined

utils.menu.createMenuButton('Start simulation', (args) => {
    const elem = document.getElementById('Start simulation')
    
    if (simRunning) {
        elem.innerText = 'Start simulation' 
        clearInterval(intervalId)
    }
    else {
        elem.innerText = 'Stop simulation'
        const components = component.getAllComponents();
        const visited = new Set();
        const sorted = [];

        function dfs(node) {
            if (visited.has(node)) return;
            visited.add(node);

            for (const neighbor of node.nextComponents) {
                dfs(neighbor);
            }

            sorted.push(node);
        }

        for (const comp of components) {
            dfs(comp);
        }

        sorted.reverse();

        intervalId = setInterval(() => {
            for (const comp of sorted) {
                comp.simulate?.();
            }
        }, 15)
    }

    simRunning = !simRunning
})

