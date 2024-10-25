export class ApiError extends Error {
    constructor(message, ...args) { super(message, ...args); }
}
