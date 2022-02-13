export function pickRandom(array) {
    const index = Math.floor(array.length * Math.random());
    return array[index];
}

export function loadImage(src) {
    return new Promise((fulfil, reject) => {
        const img = new Image();
        img.onload = () => fulfil();
        img.onerror = reject;
        img.src = src;
    });
}
