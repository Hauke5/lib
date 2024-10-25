import { AppRouterInstance } 
               from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ReadonlyURLSearchParams, usePathname, useRouter, useSearchParams } 
               from "next/navigation";
import { useEffect, useId, useRef, useState } 
               from "react";
import { Log } from "../utils";

const log = Log(`useURLState`)

/** 
 * stores a component state as a query for `<key>` in the URL.
 * The interface is designed to mimick that of `useState`, except that it works on a global context.
 */
export function useURLState<T extends string = string>(key:string, initialState: T | (() => T)): [T, (s:T)=>void];
export function useURLState<T extends string = string>(key:string): [T|undefined, (s:T)=>void];
export function useURLState<T extends string = string>(key:string, initialState?: T | (() => T)): [T|undefined, (s:T)=>void] {
   const pathname = usePathname()
   const query    = useSearchParams()
   const router   = useRouter()
   const state    = query.get(key) as T
   const [urlState, setUrlState] = useState<[T, (s: T)=>void]>([state, setStateFn(key, pathname, router, query)])

   useEffect(()=>{   // setState function update
      if (!state && initialState!==undefined) { 
         // set initial state, if given
         const initial = typeof initialState === 'function'? initialState() : initialState
         log.debug(`useURLState(${key}) useEffect initial state ${initial}`)
         setStateFn(key, pathname, router, query)(initial)
      } else {
         log.debug(`useURLState(${key}) useEffect update`)
         setUrlState([state, setStateFn(key, pathname, router, query)])
      }
   },[key, pathname, query, query.size, router, initialState, state])

   return urlState
}

function setStateFn(key:string, pathname:string, router:AppRouterInstance, query:ReadonlyURLSearchParams) {
   return <T extends string = string>(s:T):void => {
      log.debug(`useURLState(${key}): ${s}`)
      if (s.length>0) {
         const map = new Map(query.entries())
         map.set(key, s)
         const href = `${pathname}?${map.size? Array
            .from(map.entries())
            .map(([k, v]) => `${k}=${v}`)
            .join('&') : ''}`
         router.push(href)
      }
   }
}


export function useURLMultiState(): (pairs:{[stateKey:string]:string})=>void {
   const pathname = usePathname()
   const query    = useSearchParams()
   const router   = useRouter()
   const [urlState, setUrlState] = useState({fn:setMultiStateFn(pathname, router, query)})

   useEffect(()=>{   // setState function update
      setUrlState({fn:setMultiStateFn(pathname, router, query)})
   },[pathname, query, router])

   return urlState.fn
}

function setMultiStateFn(pathname:string, router:AppRouterInstance, query:ReadonlyURLSearchParams) {
   return (pairs:{[stateKey:string]:string}) => {
      log.debug(`useURLMultiState(${Object.entries(pairs).map(([key, val]) => `${key}='${val}'`).join(', ')}):`)
      const map = new Map(query.entries())
      Object.entries(pairs).map(([key, val]) => map.set(key, val))
      const href = `${pathname}?${map.size? Array
         .from(map.entries())
         .map(([k, v]) => `${k}=${v}`)
         .join('&') : ''}`
      router.push(href)
   }
}
