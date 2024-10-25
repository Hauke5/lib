import { Log } from "../utils/log";
import { authFetcher } from "./authFetcher";
import { cachedFetcher } from "./cachedFetcher";
import { pacedFetcher } from "./pacedFetcher";
const log = Log(`fetcher`, { maxLength: 170 });
export function fetcher(strategy) {
    const fetch = cachedFetcher(strategy, // return cached version, if available; otherwise delegate lower
    pacedFetcher(strategy, // pace fetch calls in lower hierarchy
    cachedFetcher(strategy, // return cached version, if cached in the mean tine
    authFetcher(strategy, // add authorizations
    systemFetcher(strategy)))));
    return { fetch, get, post };
    async function get(input, init) {
        try {
            if (!init)
                init = {};
            init.method = 'GET';
            if (!init.headers)
                init.headers = {};
            init.headers["Content-Type"] = "application/json";
            // console.log(`prefetch ${input}`)
            const response = await fetch(input, init);
            // console.log(`postfetch ${input}`)
            const cachedMessage = `CACHED:${response.cached.modified.toLocaleDateString('en-US', { year: '2-digit', month: '2-digit', day: '2-digit', })} `;
            const cached = response.cached.fromCache ? cachedMessage : 'ONLINE ';
            const pacing = response.pacing;
            const delay = pacing ? `paced:${pacing.completed.getTime() - pacing.queued.getTime()}ms ` : '';
            // console.log(`preparse ${input}`)
            const data = strategy.getAs === 'json' ? await response.json() : await response.text();
            // console.log(`postparse ${input}`)
            log.info(`${init.method} ${response.ok ? 'OK' : response.statusText} ${cached}${delay}${strategy.getAs?.toUpperCase() ?? ''} ${input}`);
            return data;
        }
        catch (e) {
            log.warn(`${e} getting ${input}`);
            console.trace();
            return e;
        }
    }
    async function post(input, data, init) {
        try {
            if (!init)
                init = {};
            init.body = JSON.stringify(data);
            init.method = 'POST';
            const response = await fetch(input, init);
            return response.statusText;
        }
        catch (e) {
            log.warn(`${e} posting ${input}`);
            return e;
        }
    }
}
/**
 * Provides the basic system fetch call.
 * If `strategy` contains any header settings, these will be added to each fetch call.
 * @returns the system `fetch` function
 */
function systemFetcher(strategy) {
    return async (input, init) => {
        if (strategy.headers) {
            init ??= {};
            init.headers ??= {};
            for (const k in strategy.headers)
                init.headers[k] = strategy.headers[k];
        }
        log.debug(() => `online ${init?.method ?? 'GET'} ${input}`);
        const result = await fetch(input, init);
        return result;
    };
}
