function arraysEqual(a, b) {
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
        if (Array.isArray(a[i]) && Array.isArray(b[i])) {
            if (!arraysEqual(a[i], b[i])) return false;
        } else if (a[i] !== b[i]) {
            return false;
        }
    }
    return true;
}

const isString = value => typeof value === "string" || value instanceof String;

function isInstanceOfClassAndInherits(obj, baseClass) {
    if (typeof obj !== 'object' || obj === null) return false;

    let proto = Object.getPrototypeOf(obj);

    while (proto) {
        if (proto.constructor === baseClass) return true;
        proto = Object.getPrototypeOf(proto);
    }

    return false;
}

export default {
    arraysEqual,
    isString,
    isInstanceOfClassAndInherits
}