import { ScreenObject } from "./engine.js";
import { Shape } from "./shape.js";

function updateSvgLine(linesvg, points) {
    linesvg.setAttribute("points", points.map((e) => [e.x, e.y]).join(" "));
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

function addOrthogonalPoint(path, newPoint) {
    if (path.length === 0) {
        path.push(newPoint);
        return 1
    }

    const last = path[path.length - 1];

    // If already aligned, just connect directly
    if (last.x === newPoint.x || last.y === newPoint.y) {
        path.push(newPoint)
        return 1
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

    path.push(bend)
    path.push(newPoint)
    return 2
}

class Line extends ScreenObject {
    constructor() {
        super()
        this.model = new Shape(createPolyline([])) 
        this.path = []
    }

    addPoint(newPoint) {
        this.addedCount = addOrthogonalPoint(this.path, newPoint)
        updateSvgLine(this.model.svg, this.path)
    }

    removeLast() {
        this.path.length -= this.addedCount
        this.addedCount = 0
    }
}

export {
    Line
}