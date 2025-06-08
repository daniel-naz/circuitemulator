import canvas from "./canvas.js";
// import { ComputationalComponent } from "./component.js";
import globals from "./global.js";
import utils from "./utils.js";
import component, { Component } from "./component.js";
import { ComputeComponent, ConnectorNode } from "./component.js";


const svg = document.getElementById("canvas");

function convertToGrid(x, y) {
    const grid = globals.GRID.SIZE;
    return [Math.round(x / grid) * grid, Math.round(y / grid) * grid]
}


function addOrthogonalPoint(path, newPoint) {
    if (path.length === 0) {
        return [newPoint];
    }

    const last = path[path.length - 1];

    // If already aligned, just connect directly
    if (last.x === newPoint.x || last.y === newPoint.y) {
        return [...path, newPoint];
    }

    // Determine previous direction
    let dx = 0;
    let dy = 0;
    if (path.length >= 2) {
        const secondLast = path[path.length - 2];
        dx = last.x - secondLast.x;
        dy = last.y - secondLast.y;
    }

    let bend;
    if (Math.abs(dx) > 0) {
        bend = { x: newPoint.x, y: last.y };
    } else if (Math.abs(dy) > 0) {
        bend = { x: last.x, y: newPoint.y };
    } else {
        bend = { x: newPoint.x, y: last.y };
    }

    return [...path, bend, newPoint];
}


function updateSvgLine(line, points) {
    line.setAttribute("points", points.map((e) => [e.x, e.y]).join(" "));
}

function createPolyline(points = [], attributes = {}) {
    const svgNS = "http://www.w3.org/2000/svg";
    const polyline = document.createElementNS(svgNS, "polyline");

    // Set the 'points' attribute
    const pointsString = points.map(p => `${p.x},${p.y}`).join(" ");
    polyline.setAttribute("points", pointsString);

    // Set default visual attributes if not provided
    polyline.setAttribute("fill", attributes.fill ?? "none");
    polyline.setAttribute("stroke", attributes.stroke ?? "black");
    polyline.setAttribute("stroke-width", attributes["stroke-width"] ?? "2");

    // Set any additional attributes
    for (const [key, value] of Object.entries(attributes)) {
        polyline.setAttribute(key, value);
    }

    return polyline;
}

let linepoints = []
let creatingLine = false;
let line = undefined
let startconnector = undefined

// // ----- Initilize canvas events -----
svg.addEventListener("mousedown", (e) => {
    const [x, y] = canvas.getGlobalMouse(e)
    const [gx, gy] = convertToGrid(x, y)

    if (e.button == 2) {
        if (line) {
            svg.removeChild(line)
            line = undefined
            linepoints.length = 0
        }
    }
    if (line) {
        linepoints = addOrthogonalPoint(linepoints, { x: gx, y: gy })
        updateSvgLine(line, linepoints)
    }

    const n = component.isInNode(x, y)
    const c = component.isInComponent(x, y)
    if (n) {
        if (!line) {
            startconnector = n;
            linepoints = addOrthogonalPoint([], { x: gx, y: gy }); // Start fresh
            line = createPolyline();
            updateSvgLine(line, linepoints);
            svg.appendChild(line);
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
            linepoints.length = 0;
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
        const tempPoints = [...linepoints]
        const newTemp = addOrthogonalPoint(tempPoints, { x: gx, y: gy })
        updateSvgLine(line, newTemp)
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

