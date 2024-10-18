import { Log }          from "../utils/log"
import { AuthStrategy, authFetcher }  
                        from "./authFetcher"
import { CachingStrategy, cachedFetcher } 
                        from "./cachedFetcher"
import { PacingStrategy, pacedFetcher }   
                        from "./pacedFetcher"

const log = Log(`fetcher`,{maxLength:170})

export type Fetch<R extends Response=Response> = (input: RequestInfo | URL, init?: RequestInit) => Promise<R>
export type Get   = <DATA>(input: RequestInfo | URL, init?: RequestInit) => Promise<DATA>
export type Post  = <DATA>(input: RequestInfo | URL, data:DATA, init?: RequestInit) => Promise<string>

export type FetchStrategy = PacingStrategy & CachingStrategy & AuthStrategy & {
   headers?: {[key:string]:string}
   /** when using the `get` version of `fetch`, return content as `json` or `text` */
   getAs?:  'json' | 'text'
}


export function fetcher(strategy:FetchStrategy):{fetch:Fetch, get:Get, post:Post} {
   const fetch =  cachedFetcher(strategy, // return cached version, if available; otherwise delegate lower
                  pacedFetcher(strategy,  // pace fetch calls in lower hierarchy
                  cachedFetcher(strategy, // return cached version, if cached in the mean tine
                  authFetcher(strategy,   // add authorizations
                  systemFetcher(strategy, // last, fetch from the intended server
         )))))
   return {fetch, get, post}

   async function get<DATA>(input: RequestInfo | URL, init?: RequestInit): Promise<DATA> {
      try {
         if (!init) init = {}
         init.method = 'GET'
         if (!init.headers) init.headers = {}
         init.headers["Content-Type"] = "application/json"
// console.log(`prefetch ${input}`)
         const response = await fetch(input, init)
// console.log(`postfetch ${input}`)
         const cachedMessage = `CACHED:${response.cached.modified.toLocaleDateString('en-US',{year:'2-digit',month:'2-digit',day:'2-digit',})} `
         const cached = response.cached.fromCache?cachedMessage:'ONLINE '
         const pacing = response.pacing
         const delay = pacing? `paced:${pacing.completed.getTime() - pacing.queued.getTime()}ms ` : ''
// console.log(`preparse ${input}`)
         const data:DATA = strategy.getAs==='json'? await response.json() : await response.text()
// console.log(`postparse ${input}`)
         log.info(`${init.method} ${response.ok?'OK':response.statusText} ${cached}${delay}${strategy.getAs?.toUpperCase()??''} ${input}`)
         return data
      } catch(e) {
         log.warn(`${e} getting ${input}`)
         console.trace()
         return e
      }
   }

   async function post<DATA>(input: RequestInfo | URL, data:DATA, init?: RequestInit): Promise<string> {
      try {
         if (!init) init = {}
         init.body = JSON.stringify(data)
         init.method = 'POST'
         const response = await fetch(input, init)
         return response.statusText
      } catch(e) {
         log.warn(`${e} posting ${input}`)
         return e
      }
   }
}

/**
 * Provides the basic system fetch call.
 * If `strategy` contains any header settings, these will be added to each fetch call.
 * @returns the system `fetch` function
 */
function systemFetcher<R extends Response=Response>(strategy:FetchStrategy):Fetch<R> {
   return async (input: RequestInfo | URL, init?: RequestInit) => {
      if (strategy.headers) {
         init ??= {}
         init.headers ??= {}
         for (const k in strategy.headers) init.headers[k] = strategy.headers[k]
      }
      log.debug(()=>`online ${init?.method??'GET'} ${input}`); 
      const result = await fetch(input, init) as R & Response
      return result
   }
}
