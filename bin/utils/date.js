const MS_PER_DAY = 1000 * 60 * 60 * 24;
const MS_PER_YEAR = MS_PER_DAY * 365;
export const MS2DAYS = (ms) => ms / MS_PER_DAY;
export const DAYS2MS = (days) => days * MS_PER_DAY;
export const MS2YEARS = (ms) => ms / MS_PER_YEAR;
export const YEARS2MS = (y) => y * MS_PER_YEAR;
const Months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const Days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
/**
* Formats Dates according to a formatting template
* ## Example:
* # Date formatting support.
* Formats are specified in a printf-style format string.
* ## Supported Formats
* - `%YY, %YYYY`           : two- or four-digit year, as '73', '1973'
* - `%M, %MM, %MMM, %MMMM` : month of year as '2', '02', 'Feb', 'February'
* - `%D, %DD`              : day of month as '5', '05' (1...31)
* - `%DDD, %DDDD`          : day of week as 'Tue', 'Tuesday'
* - `%h, %hh`              : hour of day as '7', '07 (0...23)
* - `%m, %mm`              : minutes as '6', '06' (0..59)
* - `%ss`                  : seconds as '09' (0...59)
* - `%j, %jj, %jjj`        : milliseconds as '1', '15', '159'
* <pre>
* date('%MM/%DD/%YY');           // -> 08/17/16 (using current date)
* let d = new Date('7/4/2010');
* date('%DDDD, %MM/%DD/%YY', d); // -> Sunday, 07/04/10
* </pre>
* @param formatString the format string to use.
* @param [date=new Date()] the date to format.
* @returns a copy of `formatString` where all supported patterns are replaced by the respective values from `date`.
*/
export function formatDate(formatString, date = new Date()) {
    const result = formatString.replaceAll(/%(Y+|M+|D+|h+|m+|s+|j+)/g, (match, p1, offset, string, groups) => {
        switch (p1) {
            case 'YYYY': return `${date.getFullYear()}`;
            case 'YY':
            case 'Y': return `${date.getFullYear() % 100}`;
            case 'MMMM': return `${Months[date.getMonth()]}`;
            case 'MMM': return `${Months[date.getMonth()].slice(0, 3)}`;
            case 'MM': return `${date.getMonth() + 1}`.padStart(2, '0');
            case 'M': return `${date.getMonth() + 1}`;
            case 'DDDD': return `${Days[date.getDay()]}`;
            case 'DDD': return `${Days[date.getDay()].slice(0, 3)}`;
            case 'DD': return `${date.getDate()}`.padStart(2, '0');
            case 'D': return `${date.getDate()}`;
            case 'hh': return `${date.getHours()}`.padStart(2, '0');
            case 'h': return `${date.getHours()}`;
            case 'mm': return `${date.getMinutes()}`.padStart(2, '0');
            case 'm': return `${date.getMinutes()}`;
            case 'ss': return `${date.getSeconds()}`.padStart(2, '0');
            case 's': return `${date.getSeconds()}`;
            case 'jjj': return `${date.getMilliseconds()}`.padStart(3, '0');
            case 'jj': return `${Math.floor(date.getMilliseconds() / 10)}`.padStart(2, '0');
            case 'j': return `${Math.floor(date.getMilliseconds() / 100)}`;
        }
        return '';
    });
    return result;
}
/** converts minutes, hours, days, weeks ... into milliseconds and back */
export const ms = {
    fromMinutes: (min) => 1000 * 60 * min,
    fromHours: (h) => 1000 * 60 * 60 * h,
    fromDays: (d) => 1000 * 60 * 60 * 24 * d,
    fromWeeks: (w) => 1000 * 60 * 60 * 24 * 7 * w,
    toMinutes: (ms) => ms / (1000 * 60),
    toHours: (ms) => ms / (1000 * 60 * 60),
    toDays: (ms) => ms / (1000 * 60 * 60 * 24),
    toWeeks: (ms) => ms / (1000 * 60 * 60 * 24 * 7)
};
export function isLastBusinessDayOfMonth(date, holidays) {
    const isHoliday = (d) => holidays.includes(shortDateString(d));
    const isWeekend = (d) => d.getDay() === 6 || d.getDay() === 0;
    const nextBusinessDay = new Date(date);
    do
        nextBusinessDay.setDate(nextBusinessDay.getDate() + 1);
    while (isHoliday(nextBusinessDay) || isWeekend(nextBusinessDay));
    const isLastBusDay = nextBusinessDay.getMonth() !== date.getMonth();
    return isLastBusDay ? true : false;
}
export function shortDateString(d) {
    return d.toLocaleDateString(undefined, { dateStyle: 'short' });
}
const dateFmt = '%M/%D/%YY %h:%m';
/**
 * converts a date into a text string that reflects the relative amount of time passed for `date`.
 * @param date
 * @returns
 * - `dateString` the relative date string
 * - `refresh` the suggested number of seconds for a refresh of the text.
 */
export function dateToRelative(date) {
    const sec = 1;
    const min = 60;
    const hour = 60 * min;
    const diff = (Date.now() - date.getTime?.()) / 1000;
    if (diff < 3 * sec)
        return { dateString: 'just now', refresh: 10 * sec };
    if (diff < 30 * sec)
        return { dateString: 'a few seconds ago', refresh: 10 * sec };
    if (diff < 1 * min)
        return { dateString: 'less than a minute ago', refresh: 30 * sec };
    if (diff < 2 * min)
        return { dateString: 'a minute ago', refresh: 1 * min };
    if (diff < 5 * min)
        return { dateString: 'a few minutes ago', refresh: 1 * min };
    if (diff < 1 * hour)
        return { dateString: `${Math.round(diff / 60)}' ago`, refresh: 1 * min };
    if (diff < 24 * hour)
        return { dateString: `${Math.round(diff / 3600)}h ago`, refresh: 1 * hour };
    // else: show absolute date
    return { dateString: formatDate(dateFmt, date), refresh: 1 * hour };
}
