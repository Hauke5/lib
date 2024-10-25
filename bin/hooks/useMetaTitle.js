import { useEffect } from "react";
/**
 * sets the string in the browser's title field of the form
 * `HSApps <topic> <server>`
 */
export function useExportTitle(topic = '') {
    useEffect(() => {
        document.title = `HSApps ${topic} ${window.location.hostname}`; // window.location.host 
    }, [topic]);
}
