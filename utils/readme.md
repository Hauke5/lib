## Utils
Platform-agnostic utility functions:

### log
Extends the `console.log` output with
- a formatted date prefix for each message
- colored output for different logLevels
- transient outputs that don't add a line feed and will be overwritten by the next log statement
- ability to set a maximum number of characters per line. Messages will be shortend in the middle to accommodate.

### date
- `date`: Formats Dates according to a formatting template

### timing
- `delay`: Returns a `Promise` that resolves after `ms` milliseconds.
- `alarm`: Sets an alarm `at` the specifed datetime, at which `action` is executed.
- `getThrottle`: Returns a `Throttle` function that ensures actions are not called with less than `pace` ms between calls.

### strings
- `adjustLength`: lenght-adjusts a string, either shortening it in the middle, or left padding it to match a length requirement

### number
- `formatNumber`: a convenience wrapper for [Intl.NumberFormat](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat)
- `formatCurrency`: a wrapper for `formatNumber` providing a currency format and defaulting to `$`.
- `formatDecimal`: a wrapper for `formatNumber` providing a grouped, compact default number display
- `formatPercent`: a wrapper for `formatNumber` providing a grouped, compact default `%` display
