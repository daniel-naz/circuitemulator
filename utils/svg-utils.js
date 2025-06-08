function styleShape(shape) {
    shape.setAttribute('stroke', 'black');
    shape.setAttribute('stroke-width', 2);
    shape.setAttribute('fill', 'none');
}

function createBoxSvg(inCount, outCount) {
    const ns = "http://www.w3.org/2000/svg";
    const rect = document.createElementNS(ns, 'rect');
    const gridSize = global.GRID.SIZE
    const shapeSize = gridSize * (Math.max(inCount, outCount) + 1)

    const svg = document.createElementNS(ns, 'g');

    rect.setAttribute('x', 0);
    rect.setAttribute('y', 0);
    rect.setAttribute('width', shapeSize);
    rect.setAttribute('height', shapeSize);

    for (let i = 1; i <= inCount; i++) {
        const line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', 0);
        line.setAttribute('y1', 0 + gridSize * i);
        line.setAttribute('x2', 0 - gridSize);
        line.setAttribute('y2', 0 + gridSize * i);
        utils.styleShape(line)
    }

    for (let i = 1; i <= outCount; i++) {
        const line = document.createElementNS(ns, 'line');
        line.setAttribute('x1', shapeSize);
        line.setAttribute('y1', 0 + gridSize * i);
        line.setAttribute('x2', shapeSize + gridSize);
        line.setAttribute('y2', 0 + gridSize * i);
        utils.styleShape(line)
    }
    
    utils.styleShape(rect)
    svg.appendChild(rect)
    return svg
}

function createSvgFromText(svgContent) {
    const svgNS = "http://www.w3.org/2000/svg";

    const wrapped = `<svg xmlns="${svgNS}"><g>${svgContent}</g></svg>`;

    const parser = new DOMParser();
    const doc = parser.parseFromString(wrapped, "image/svg+xml");

    const g = doc.querySelector("g");

    return document.importNode(g, true);
}

function getBBoxIgnoringIO(shapeGroup) {
    const children = [...shapeGroup.children];
    const filtered = children.filter(el => !el.classList.contains('input') && !el.classList.contains('output'));

    if (filtered.length === 0) return null;

    let bbox = filtered[0].getBBox();
    for (let i = 1; i < filtered.length; i++) {
        const b = filtered[i].getBBox();
        const minX = Math.min(bbox.x, b.x);
        const minY = Math.min(bbox.y, b.y);
        const maxX = Math.max(bbox.x + bbox.width, b.x + b.width);
        const maxY = Math.max(bbox.y + bbox.height, b.y + b.height);

        bbox = {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
    return bbox;
}

export default {
    styleShape,
    createBoxSvg,
    createSvgFromText,
    getBBoxIgnoringIO
}