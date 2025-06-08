function downloadUint8Array(data, filename = 'file.bin') {
    // Create a Blob from the Uint8Array
    const blob = new Blob([data], { type: 'application/octet-stream' });

    // Create a temporary URL for the Blob
    const url = URL.createObjectURL(blob);

    // Create a temporary <a> element to trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;

    // Append to body, click, then remove
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    // Release the URL object
    URL.revokeObjectURL(url);
}

function concatUint8Arrays(arr1, arr2) {
    const result = new Uint8Array(arr1.length + arr2.length);
    result.set(arr1, 0);           // copy arr1 starting at index 0
    result.set(arr2, arr1.length); // copy arr2 starting after arr1
    return result;
}


export default {
    downloadUint8Array,
    concatUint8Arrays
}