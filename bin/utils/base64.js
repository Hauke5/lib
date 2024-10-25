export function base64ToBytes(base64) {
    const binString = atob(base64);
    return Uint8Array.from(binString, (m) => m.codePointAt(0));
}
export function bytesToBase64(bytes) {
    const binString = Array.from(bytes, (byte) => String.fromCodePoint(byte)).join("");
    return btoa(binString);
}
export function generateUniqueBase64ID(username) {
    const bytes = Array(username.length).fill(0).map((_, i) => username.charCodeAt(i));
    return bytesToBase64(Uint8Array.from(bytes));
}
