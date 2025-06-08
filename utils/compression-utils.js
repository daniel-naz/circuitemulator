import * as pako from 'https://esm.sh/pako@latest';


/**
 * @param {Uint8Array} arr 
 */
function base64compress(arr) {
    let binary = '';
    for (let i = 0; i < arr.length; i++) {
        binary += String.fromCharCode(arr[i]);
    }

    return btoa(binary);
}

/**
 * @param {string} base64 
 */
function base64decompress(base64) {
    const binaryStr = atob(base64); // decode Base64 to binary string
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
    }
    return bytes;
}

/**
 * @param {Uint8Array} arr 
 */
function pakoCompress(arr) {
    const compressed = pako.deflate(arr);
    return base64compress(compressed)
}

/**
 * @param {string} str 
 */
function pakoDecompress(arr) {
    const compressed = base64decompress(arr)
    return pako.inflate(compressed)
}

export default {
    pakoCompress,
    pakoDecompress,
    base64compress,
    base64decompress
}