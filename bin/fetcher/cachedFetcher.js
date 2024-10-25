import { Log } from 'lib/utils/log';
const log = Log('cachedFetcher');
/**
 * Provides a caching mechanism. Requests to the `Fetch` function returned by this fetcher will
 * - attempt to read-from-cache if a `readCache` implementation exists and
 * - the resulting response will be returned if
 *    1. the read-from-cache was successful and
 *    2. no `cacheRefresh` is requested or a refresh is denied by some entry in `cacheDenyRefresh`
 * - otherwise the function defers to the provided `_fetch` function and attempts to write-to-cache if
 *    1. the response is valid or
 *    2. any of the `cacheAllow` entries return true
 * - if the write-to-cache was successful, a subsequent read-from-cache is attempted and the resulting `response` returned, if successful
 * - otherwise, the `response` from the provided `_fetch` function is returned

 * @param strategy the `CachingStrategy` to use
 * @param _fetch optional `fetch` function; defaults to the standard system `fetch`
 * @returns a customized `fetch` function that follows the `CachingStrategy`
 */
export function cachedFetcher(strategy, _fetch) {
    if (!strategy.caching)
        return _fetch;
    const caching = strategy.caching;
    const impl = caching.implementation;
    if (!impl) {
        log.warn(`no cache implementation found; skipping cache`);
        return _fetch;
    }
    return async (input, init) => {
        const method = input.method ?? init?.method ?? 'GET';
        const fname = impl.cacheName?.(input, caching);
        if (!fname) {
            return {
                ok: false,
                status: 501,
                statusText: `'cacheName' not defined in CachingStrategy; no action taken`
            };
        }
        else if (method === 'DELETE') {
            if (impl.removeCache) {
                impl.removeCache(fname, init);
                log.info(`DELETE ok ${input.toString()}`);
                return {
                    ok: true,
                    status: 200,
                    statusText: 'Cache Removed'
                };
            }
            else
                return {
                    ok: false,
                    status: 501,
                    statusText: `'removeCache' not defined in CachingStrategy; no action taken`
                };
        }
        else if (method === 'GET') {
            if (impl.readCache) {
                const response = await tryCacheRead(impl.readCache, fname, init);
                // return cache if 
                //  1. cache response exists and 
                //  2. no refresh is requested or a refresh is denied
                if (response && (caching.cacheDenyRefresh?.some(n => n(response)) || !caching.cacheRefresh?.some(re => re(response)))) {
                    log.debug(() => `cached GET ok ${input.toString()}`);
                    return response;
                }
            }
            else
                log.warn(`'readCache' not defined in CachingStrategy; no cache read attempted`);
        }
        // if not addressed above, call `fetch` from server and save in cache
        log.debug(() => `no cache found for ${fname}, calling direct`);
        const response = await _fetch(input, init);
        if (fname)
            await tryCacheWrite(caching, response, fname, init);
        log.debug(`cached ${method} ${fname}`);
        const now = new Date();
        response.cached = { fromCache: false, created: now, modified: now, accessed: now };
        return response;
    };
}
/**
 * attempts to GET a cached version of the resource
 * @returns a Promise for the `Response` if successful.
 * Otherwise returns a Promise resolving to `undefined` if caching is
 * not enabled or not configured, or if no cached version is available
 */
async function tryCacheRead(readCached, fname, init) {
    const { meta, content, times } = await readCached(fname, init);
    if (!meta) {
        return undefined;
    }
    return {
        headers: new Headers(meta.headers),
        ok: meta.ok,
        redirected: meta.redirected,
        status: meta.status,
        statusText: meta.statusText,
        type: meta.type,
        url: meta.url,
        clone: () => Object.assign({}, this),
        json: async () => {
            try {
                // console.log(`attempting to parse for ${fname}`)
                return JSON.parse(content);
            }
            catch (e) {
                console.error(`error parsing JSON content from  ${fname}: \n${content}`);
            }
        },
        cached: Object.assign({ fromCache: true }, times),
        body: createReadableStream(content),
        bodyUsed: false,
        arrayBuffer: async () => new ArrayBuffer(0),
        blob: async () => new Blob(),
        formData: async () => new FormData(),
        text: async () => content
    };
}
/**
 * writes to cache if one or more of the following is true:
 * 1. the response status is between 200 and 299
 * 2. the response fulfills at least one condition in `cacheAllow`
 */
async function tryCacheWrite(caching, response, fname, init) {
    const impl = caching.implementation;
    if (!impl.writeCache) {
        log.warn(`'writeCache' not defined in CachingStrategy; no cache write attempted`);
        return response;
    }
    const validResponse = response.status >= 200 && response.status < 300 && response.ok;
    const allowCacheWrite = caching.cacheAllow?.some(ca => ca(response)) ?? true;
    if (validResponse || allowCacheWrite) {
        const isText = contentIsText(response.headers.get("content-type") ?? '');
        const headers = {};
        response.headers.forEach((v, k) => headers[k] = v);
        const meta = {
            url: response.url,
            isBinary: !isText,
            status: response.status,
            statusText: response.statusText,
            headers,
            ok: response.ok,
            redirected: response.redirected,
            type: response.type,
        };
        let content = '';
        try {
            content = meta.isBinary ? JSON.stringify(await response.json()) : await response.text();
            response.json = async () => JSON.parse(content);
            response.text = async () => content;
        }
        catch (e) {
            log.error(`tryCacheWrite get payload ${fname}`);
        }
        try {
            impl.writeCache(fname, meta, content, init);
            log.debug(`wrote cache ${fname}`);
            const newResponse = impl.readCache ? await tryCacheRead(impl.readCache, fname, init) : null;
            if (!newResponse)
                throw Error(`couldn't read cache after write`);
            return newResponse;
        }
        catch (e) {
            console.warn(`error writing cache for content ${response.headers.get("content-type")} and file ${fname}: ${e}`);
        }
        return response;
    }
    else {
        console.warn(`no cache write, response=${response.status} ${response.statusText}, ok=${response.ok} '${fname}'`);
    }
    // no allowCache: remove any cached file
    if (impl.removeCache)
        impl.removeCache(fname, init);
    else
        log.warn(`'removeCache' not defined in CachingStrategy; no cache remove attempted`);
    return response;
}
export function contentIsText(type) {
    return [
        'text',
        'text/html',
        'text/markdown',
        'application/json'
    ].some(t => (type ?? 'text').indexOf(t) >= 0);
}
function createReadableStream(content) {
    return new ReadableStream({
        start(controller) {
            controller.enqueue(Uint8Array.from(content.split("").map(x => x.charCodeAt(0))));
        },
        pull(controller) { },
        cancel() { }
    });
}
