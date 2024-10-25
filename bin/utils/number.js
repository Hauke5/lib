export function formatNumber(options) {
    const format = Intl.NumberFormat(undefined, options).format;
    return (value) => format(value);
}
export function formatDecimal(options) {
    const format = formatNumber(Object.assign({
        style: 'decimal',
        useGrouping: true,
        compactDisplay: "short",
    }, options));
    return (val) => format(val).replaceAll(',', ' ');
}
export function formatPercent(options) {
    const format = formatNumber(Object.assign({
        style: 'percent',
        useGrouping: true,
        compactDisplay: "short",
    }, options));
    return (val) => format(val).replaceAll(',', ' ');
}
export function formatCurrency(options) {
    const format = formatNumber(Object.assign({
        style: 'currency',
        currency: 'USD',
        useGrouping: true,
        compactDisplay: "short",
    }, options));
    return (val) => format(val).replaceAll(',', ' ');
}
