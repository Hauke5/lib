import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Log } from "../utils";
const log = Log(`useURLState`);
export function useURLState(key, initialState) {
    const pathname = usePathname();
    const query = useSearchParams();
    const router = useRouter();
    const state = query.get(key);
    const [urlState, setUrlState] = useState([state, setStateFn(key, pathname, router, query)]);
    useEffect(() => {
        if (!state && initialState !== undefined) {
            // set initial state, if given
            const initial = typeof initialState === 'function' ? initialState() : initialState;
            log.debug(`useURLState(${key}) useEffect initial state ${initial}`);
            setStateFn(key, pathname, router, query)(initial);
        }
        else {
            log.debug(`useURLState(${key}) useEffect update`);
            setUrlState([state, setStateFn(key, pathname, router, query)]);
        }
    }, [key, pathname, query, query.size, router, initialState, state]);
    return urlState;
}
function setStateFn(key, pathname, router, query) {
    return (s) => {
        log.debug(`useURLState(${key}): ${s}`);
        if (s.length > 0) {
            const map = new Map(query.entries());
            map.set(key, s);
            const href = `${pathname}?${map.size ? Array
                .from(map.entries())
                .map(([k, v]) => `${k}=${v}`)
                .join('&') : ''}`;
            router.push(href);
        }
    };
}
export function useURLMultiState() {
    const pathname = usePathname();
    const query = useSearchParams();
    const router = useRouter();
    const [urlState, setUrlState] = useState({ fn: setMultiStateFn(pathname, router, query) });
    useEffect(() => {
        setUrlState({ fn: setMultiStateFn(pathname, router, query) });
    }, [pathname, query, router]);
    return urlState.fn;
}
function setMultiStateFn(pathname, router, query) {
    return (pairs) => {
        log.debug(`useURLMultiState(${Object.entries(pairs).map(([key, val]) => `${key}='${val}'`).join(', ')}):`);
        const map = new Map(query.entries());
        Object.entries(pairs).map(([key, val]) => map.set(key, val));
        const href = `${pathname}?${map.size ? Array
            .from(map.entries())
            .map(([k, v]) => `${k}=${v}`)
            .join('&') : ''}`;
        router.push(href);
    };
}
