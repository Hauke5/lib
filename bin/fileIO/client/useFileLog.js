import { useAppDesc } from "lib/apps";
import { formatDate, Log } from "lib/utils";
import { serverTextWrite } from "../server/serverFileIO";
export function useFileLog(prefix, dir) {
    const { key } = useAppDesc();
    return log(key, prefix, dir);
}
export function FileLog(apiKey, prefix, file) {
    return log(apiKey, prefix, file);
}
function log(appKey, prefix, dir) {
    const localLog = Log(prefix, { INFO: ['darkmagenta', 'bold'] });
    const fileLog = Log(prefix);
    const file = `${dir}/${formatDate(fileLog.config().dateFormat)}`;
    const io = {
        DEBUG: (msg) => serverTextWrite(appKey, file, msg, { append: true }),
        INFO: (msg) => serverTextWrite(appKey, file, msg, { append: true }),
        WARN: (msg) => serverTextWrite(appKey, file, msg, { append: true }),
        ERROR: (msg) => serverTextWrite(appKey, file, msg, { append: true }),
    };
    fileLog.config({ useColors: false }, io);
    return { record };
    /**
     * reports an info message to the log and adds an entry to a server-side log.
     * The message will actually be reported to the log only if the current
     * reporting level is DEBUG or lower.
     * @param msg the message to report. For msg types, refer to [info](utils.FileLog.FileLog.info).
     * @return the message printed
     */
    function record(msg) {
        localLog(msg);
        fileLog(msg);
    }
}
