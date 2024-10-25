import path from 'path';
import { Log } from '../utils/log';
import fs from '../fileIO/server/fsUtil';
const log = Log('cachedServer');
// log.config({maxLength:120})
const cacheServerImplementation = {
    readCache,
    writeCache,
    removeCache,
    cacheName
};
/**
 * standard implementation of caching on server:
 * provides
 * - `readCache`  :
 * - `writeCache` :
 * - `removeCache`:
 * - `cacheName`  :
 */
export default cacheServerImplementation;
async function readCache(fname) {
    try {
        const meta = fs.readJsonFileSync(`${fname}-meta.json`);
        if (!meta)
            return { meta, content: '' };
        const content = fs.readFileSync(`${fname}.json`, true);
        const times = fs.pathTimesSync(`${fname}.json`);
        log.debug(`found cache for ${fname} `);
        return { meta, content, times };
    }
    catch (e) {
        return { meta: undefined, content: '' }; // cache file not found
    }
}
async function writeCache(fname, meta, content) {
    fs.writeJsonFileSync(`${fname}-meta.json`, meta);
    fs.writeFileSync(`${fname}.json`, content, true);
    log.debug(() => `writing cache for '${fname}.json'`);
}
async function removeCache(fname) {
    try {
        fs.removeSync(`${fname}-meta.json`);
        fs.removeSync(`${fname}.json`);
    }
    catch (e) { }
}
function cacheName(input, options) {
    const cacheDir = options.cacheDest ?? '';
    const name = typeof input === 'string' ? input : input.url ?? (input.pathname + input.search);
    const fname = path.resolve(cacheDir, name
        // .replace(/\//g,'-')  // replace  '/' with '-'
        .replace(/\?/g, '~') // replace  '?' with '~'
        .replace(/:/g, '_')); // replace  ':' with '_'
    log.debug(() => `caching to '${fname}'`);
    return fname;
}
