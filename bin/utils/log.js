import { formatDate } from './date';
import { adjustLength } from './strings';
export var LogLevel;
(function (LogLevel) {
    LogLevel["DEBUG"] = "DEBUG";
    LogLevel["INFO"] = "INFO";
    LogLevel["WARN"] = "WARN";
    LogLevel["ERROR"] = "ERROR";
})(LogLevel || (LogLevel = {}));
const browserEnv = () => typeof (window) === 'object';
const levelImportance = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3
};
const defaultColors = {
    DEBUG: ['gray'],
    INFO: ['darkgreen'],
    WARN: ['darkyellow', 'bold'],
    ERROR: ['darkred', 'bold'],
};
const defDateFormat = '%YYYY%MM%DD %hh:%mm:%ss.%jjj';
/** the length of the last log output, global for all instances */
let lastOutputLength = 0;
/**
 * Extends the `console.log` output with
 * - a formatted date prefix for each message
 * - colored output for different logLevels
 * - transient outputs that don't add a line feed and will be overwritten by the next log statement
 * - ability to set a maximum number of characters per line. Messages will be shortend in the middle to accommodate.
 */
export function Log(prefix, options = {}) {
    const logConfig = Object.assign({
        prefix,
        useColors: true,
        dateFormat: defDateFormat,
        level: LogLevel.INFO,
        padChar: ' ',
        maxLength: -1,
    }, defaultColors, options);
    const ioChannels = {
        [LogLevel.DEBUG]: (...args) => console.debug(...args),
        [LogLevel.INFO]: (...args) => console.info(...args),
        [LogLevel.WARN]: (...args) => console.warn(...args),
        [LogLevel.ERROR]: (...args) => console.error(...args)
    };
    const log = info;
    return Object.assign(log, {
        DEBUG: LogLevel.DEBUG, INFO: LogLevel.INFO, WARN: LogLevel.WARN, ERROR: LogLevel.ERROR,
        debug, info, transient, warn, error,
        config
    });
    /**
     * reports an debug message to the log.
     * The message will actually be reported to the log only if the current
     * reporting level is DEBUG or lower.
     * @param msgs the message to report. For msg types, refer to [Log.info](Log.info).
     * @return the message printed
     */
    function debug(...msgs) { return out(LogLevel.DEBUG, msgs, {}); }
    /**
     * reports an debug message to the log.
     * The message will actually be reported to the log only if the current
     * reporting level is DEBUG or lower.
     * @param msgs the message to report. For msg types, refer to [Log.info](Log.info).
     * @return the message printed
     */
    function transient(msg) {
        const result = out(LogLevel.INFO, [msg], { lf: '\r' });
        lastOutputLength = result.trim().length;
        return result;
    }
    /**
     * reports an informational message to the log.
     * The message will actually be reported to the log only if the current
     * reporting level is INFO or lower.}
     * @param msgs a list of message to report. The following types are supported:
     * - `string` - `'...'`: prints the string
     * - `function` - `() => '...'`: if the message level is above the threshold level, calls the function
     *    to produce the string to be printed
     * - `object literal` - `{...}`:  prints a deep inspection of the object.
     * - `Error` - if msg is an Error (e.g. from a catch statement), prints the error message as well as a stack trace.
     * @return the message printed
     */
    function info(...msgs) { return out(LogLevel.INFO, msgs, {}); }
    /**
     * reports an warning message to the log.
     * The message will actually be reported to the log only if the current
     * reporting level is WARN or lower.
     * @param msg the message to report. For msg types, refer to [Log.info](Log.info).
     * @return the message printed
     */
    function warn(...msgs) { return out(LogLevel.WARN, msgs, {}); }
    /**
     * reports an error message to the log.
     * The message will always be reported to the log.
     * @param msg the message to report. For msg types, For msg types, refer to [Log.info](Log.info).
     * In addition:
     * @return the message printed
     */
    function error(...msgs) { return out(LogLevel.ERROR, msgs, {}); }
    /**
  * reports an error message to the log.
  * The message will be reported to the log if `lvl` meets or exceeds the current reporting level.
  * @param lvl the reporting level of `msg`
  * @param msg the message to report. If `msg` is an object literal, a deep inspection will be printed.
  * Else if `msg` is a function, it will be called to return the string to print or object to inspect. This
  * avoids constructing a potentially expensive message string if the level is below the current reporting level.
  * Finally, if `msg` is a string, it will be printed with appropriate decoration, e.g. a date string and
  * prefix.
  * @return the message printed
  */
    function out(lvl, msg, options) {
        if (levelImportance[lvl] < levelImportance[logConfig.level])
            return '';
        const dateStr = formatDate(logConfig.dateFormat ?? '');
        return (msg instanceof Array)
            ? msg.map(m => processMsg(m)).join('')
            : processMsg(msg);
        function processMsg(msg) {
            if (msg === undefined)
                return '';
            let line = '';
            // if `msg` is an `Error`-like object:
            if (msg.message)
                line += processMsg(msg.message);
            if (msg.stack)
                line = `${line.padEnd(lastOutputLength, logConfig.padChar)}\n${msg.stack}`;
            switch (typeof msg) {
                case 'function': return processMsg(msg());
                case 'string':
                    line = msg.padEnd(lastOutputLength, logConfig.padChar);
                    break;
                case 'object':
                default: ioChannels[lvl](msg);
            }
            const rawPrefix = `${dateStr} ${prefix}`;
            options.length = 0;
            if (logConfig.maxLength > 0) {
                options.length = Math.min(-1, -logConfig.maxLength + rawPrefix.length);
            }
            options.color = logConfig[lvl];
            const final = formatOutput(options, rawPrefix, line, logConfig.padChar);
            lastOutputLength = 0;
            if (!browserEnv() && options.lf === '\r')
                process.stdout.write(final.join('') + '\r');
            else
                ioChannels[lvl](...final);
            return final.join('');
        }
    }
    /**
     * configures the log facility.
     * - cfg.colors: boolean, determines if output is colored
     * - cfg.dateFormat: sets the format for the timestamp for each log entry; set to `null` for default format
     * - cfg.level: sets the reporting level (same as calling log.level())
     * - cfg.padChar: sets the padding character to use when filling end of lines
     * @param cfg
     */
    function config(cfg, io) {
        if (cfg) {
            if (cfg.level && cfg.level !== logConfig.level)
                info(`new ${logConfig.prefix} log level ${cfg.level} (was ${logConfig.level})`);
            Object.assign(logConfig, cfg);
            if (cfg.dateFormat === null)
                logConfig.dateFormat = defDateFormat;
        }
        if (io) {
            Object.assign(ioChannels, io);
        }
        return logConfig;
    }
}
function formatOutput(options, rawPrefix, line, padChar = ' ') {
    const colors = colorsByEnvironment();
    const color = options.color ?? [];
    const lines = line
        .split('\n')
        .map(line => adjustLength(line, options.length ?? 0, padChar))
        .join('\n');
    const prefixColor = color?.map((_c) => colors[_c]).join(' ');
    const clearColor = colors['clear'];
    const coreMessage = `${lines}${(options.lf || '')}`;
    if (browserEnv())
        return [`%c${rawPrefix}%c ${coreMessage}`, prefixColor, clearColor];
    else {
        return [`${prefixColor}${rawPrefix}${clearColor} ${coreMessage}`];
    }
}
Log.DEBUG = LogLevel.DEBUG;
Log.INFO = LogLevel.INFO;
Log.ERROR = LogLevel.ERROR;
Log.WARN = LogLevel.WARN;
const browserColor = {
    clear: 'color:#000; background-color:inherit; font-weight:normal;',
    bold: 'font-weight:bold;',
    dim: '',
    underscore: '',
    blink: '',
    reverse: '',
    hidden: '',
    black: 'color:#000;',
    red: 'color:#f00;',
    green: 'color:#0f0;',
    yellow: 'color:#ff0;',
    blue: 'color:#00f;',
    magenta: 'color:#f0f;',
    cyan: 'color:#0ff;',
    white: 'color:#fff;',
    darkred: 'color:#800;',
    darkgreen: 'color:#080;',
    darkyellow: 'color:#880;',
    darkblue: 'color:#008;',
    darkmagenta: 'color:#808;',
    darkcyan: 'color:#088;',
    gray: 'color:#888;',
    bgBlack: 'background-color:#000;',
    bgRed: 'background-color:#f00;',
    bgGreen: 'background-color:#0f0;',
    bgYellow: 'background-color:#ff0;',
    bgBlue: 'background-color:#00f;',
    bgMagenta: 'background-color:#f0f;',
    bgCyan: 'background-color:#0ff;',
    bgWhite: 'background-color:#fff;'
};
const nodeColors = {
    clear: '\x1b[0m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
    underscore: '\x1b[4m',
    blink: '\x1b[5m',
    reverse: '\x1b[7m',
    hidden: '\x1b[8m',
    black: '\x1b[30m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
    white: '\x1b[37m',
    darkred: '\x1b[31m',
    darkgreen: '\x1b[32m',
    darkyellow: '\x1b[33m',
    darkblue: '\x1b[34m',
    darkmagenta: '\x1b[35m',
    darkcyan: '\x1b[36m',
    gray: '\x1b[37m',
    bgBlack: '\x1b[40m',
    bgRed: '\x1b[41m',
    bgGreen: '\x1b[42m',
    bgYellow: '\x1b[43m',
    bgBlue: '\x1b[44m',
    bgMagenta: '\x1b[45m',
    bgCyan: '\x1b[46m',
    bgWhite: '\x1b[47m'
};
function colorsByEnvironment() {
    return browserEnv() ? browserColor : nodeColors;
}
