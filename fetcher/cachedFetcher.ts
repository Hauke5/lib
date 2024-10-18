import { Log }    from '@hauke5/lib/utils/log'
import { Fetch }  from './fetcher';
import { Times } from '../fileIO/fsUtil';

const log = Log('cachedFetcher')

export type CachedResponse = Response & {
   cached: Times & {
      fromCache?: boolean
   }
}

type CachedFetch<R extends Response=Response> = Fetch<R & CachedResponse> 

export interface CachingImplementation {
   /** 
    * creates a cache name appropriate for the target system 
    * that is unique for the provided `input`
    */
   cacheName?:    CacheName
   /** the (server or client-side) implementation for reading from cache */
   readCache?:    ReadCache
   /** the (server or client-side) implementation for writing to cache */
   writeCache?:   WriteCache
   /** the (server or client-side) implementation for removing from cache */
   removeCache?:  RemoveCache
}
export type CacheName   =  (input: RequestInfo | URL, options:CachingOptions)             => string
export type ReadCache   =  (fname:string, init?: RequestInit, times?:Times)               => Promise<{meta:Meta|undefined, content:string, times?:Times}>
export type WriteCache  =  (fname:string, meta:Meta, content:string, init?: RequestInit)  => void
export type RemoveCache =  (fname:string, init?: RequestInit)                             => void

export type CachingStrategy = {
   caching?:  CachingOptions
}

export type CachingOptions = {
   implementation?:  CachingImplementation
   /** the type of cache to use; defaults to `file` on server and `sessionStorage` on client  */
   cacheType?:       'file' | 'localStorage' | 'sessionStorage'
   /**
    * adds conditions for which cache writes will be explicitely allowed.
    * Per default, only response codes between 200 and 299 will be cached
    */
   cacheAllow?:      CacheAllow[]
   /** adds conditions for which caches will be refreshed */
   cacheRefresh?:    CacheRefresh[]
   /** adds conditions for which caches will never be refreshed, e.g. `statusText==='Not Found'` */
   cacheDenyRefresh?:CacheRefresh[]
   /** the cache folder, or (in the browser) the storage prefix */
   cacheDest?:       string     
   /** if `true` during a cached fetch call, will remove any cache and return */
   cacheRemove?:     boolean
}

export interface Meta {
   url:        string
   isBinary:   boolean
   status:     number
   statusText: string
   headers:    any
   ok:         boolean
   redirected: boolean
   type:       ResponseType
}


export interface CacheAllow {
   (response:Response):boolean
}
export interface CacheRefresh {
   (response:Response):boolean
}


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
export function cachedFetcher<R extends Response>(strategy:CachingStrategy, _fetch:Fetch<R>):CachedFetch<R> {
   if (!strategy.caching) return _fetch as CachedFetch<R>
   const caching = strategy.caching
   const impl = caching.implementation
   if (!impl) {
      log.warn(`no cache implementation found; skipping cache`)
      return _fetch as CachedFetch<R>
   }
   
   return async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = (input as Request).method ?? init?.method ?? 'GET'
      const fname = impl.cacheName?.(input, caching)
      if (!fname) {
         return {
            ok:         false,
            status:     501,
            statusText: `'cacheName' not defined in CachingStrategy; no action taken`
         } as R & CachedResponse
      } else if (method==='DELETE') {
         if (impl.removeCache) {
            impl.removeCache(fname, init)
            log.info(`DELETE ok ${input.toString()}`)
            return {
               ok:         true,
               status:     200,
               statusText: 'Cache Removed'
            } as R & CachedResponse
         } else return {
            ok:         false,
            status:     501,
            statusText: `'removeCache' not defined in CachingStrategy; no action taken`
         } as R & CachedResponse
      }
      else if (method === 'GET') {
         if (impl.readCache) {
            const response = await tryCacheRead(impl.readCache, fname, init)
            // return cache if 
            //  1. cache response exists and 
            //  2. no refresh is requested or a refresh is denied
            if (response && (caching.cacheDenyRefresh?.some(n => n(response)) || !caching.cacheRefresh?.some(re => re(response)))) {
               log.debug(()=>`cached GET ok ${input.toString()}`)
               return response as R & CachedResponse
            }
         } else log.warn(`'readCache' not defined in CachingStrategy; no cache read attempted`)
      } 

      // if not addressed above, call `fetch` from server and save in cache
      log.debug(()=>`no cache found for ${fname}, calling direct`)
      let response = await _fetch(input, init) as R & CachedResponse
      if (fname) await tryCacheWrite(caching, response, fname, init)
      log.debug(`cached ${method} ${fname}`)
      const now = new Date()
      response.cached = {fromCache: false, created:now, modified:now, accessed:now}
      return response as R & CachedResponse
   }
}



/**
 * attempts to GET a cached version of the resource
 * @returns a Promise for the `Response` if successful.
 * Otherwise returns a Promise resolving to `undefined` if caching is 
 * not enabled or not configured, or if no cached version is available
 */
async function tryCacheRead(readCached:ReadCache, fname:string, init?:RequestInit):Promise<CachedResponse|undefined> {
   const {meta, content, times} = await readCached(fname, init)
   if (!meta) {
      return undefined
   }
   return {
      headers:       new Headers(meta.headers),
      ok:            meta.ok,
      redirected:    meta.redirected,
      status:        meta.status,
      statusText:    meta.statusText,
      type:          meta.type,
      url:           meta.url,
      clone:         () => Object.assign({}, this),
      json:          async <DATA>() => {try {
         // console.log(`attempting to parse for ${fname}`)
         return JSON.parse(content)as DATA
      } catch(e) {
         console.error(`error parsing JSON content from  ${fname}: \n${content}`)
      }},
      cached:        Object.assign({fromCache:true}, times),
      body:          createReadableStream(content),
      bodyUsed:      false,
      arrayBuffer:   async () => new ArrayBuffer(0),
      blob:          async () => new Blob(),
      formData:      async () => new FormData(),
      text:          async () => content

   }
}
/** 
 * writes to cache if one or more of the following is true:
 * 1. the response status is between 200 and 299
 * 2. the response fulfills at least one condition in `cacheAllow`
 */
async function tryCacheWrite(caching:CachingOptions, response:CachedResponse, fname:string, init?: RequestInit):Promise<CachedResponse> {
   const impl = caching.implementation
   if (!impl!.writeCache) {
      log.warn(`'writeCache' not defined in CachingStrategy; no cache write attempted`)
      return response
   }

   let validResponse = response.status >= 200 && response.status < 300 && response.ok
   const allowCacheWrite =  caching.cacheAllow?.some(ca => ca(response)) ?? true
   if(validResponse || allowCacheWrite) {
      const isText = contentIsText(response.headers.get("content-type") ?? '')
      const headers = {}
      response.headers.forEach((v,k)=>headers[k]=v)
      const meta:Meta = {
         url:        response.url,
         isBinary:   !isText,
         status:     response.status,
         statusText: response.statusText,
         headers,
         ok:         response.ok,
         redirected: response.redirected,
         type:       response.type,
      }
      let content = ''
      try {
         content = meta.isBinary? JSON.stringify(await response.json()) : await response.text()
         response.json = async () => JSON.parse(content)
         response.text = async () => content
      } catch(e) {
         log.error(`tryCacheWrite get payload ${fname}`)
      }
      try { 
         impl!.writeCache(fname, meta, content, init) 
         log.debug(`wrote cache ${fname}`)
         const newResponse = impl!.readCache? await tryCacheRead(impl!.readCache, fname, init) : null
         if (!newResponse) throw Error(`couldn't read cache after write`)
         return newResponse
      } catch(e:any) { 
         console.warn(`error writing cache for content ${response.headers.get("content-type")} and file ${fname}: ${e}`); 
      }
      return response
   } else {
      console.warn(`no cache write, response=${response.status} ${response.statusText}, ok=${response.ok} '${fname}'`)
   }
   // no allowCache: remove any cached file
   if (impl!.removeCache)
      impl!.removeCache(fname, init)
   else
      log.warn(`'removeCache' not defined in CachingStrategy; no cache remove attempted`)
   return response
}

export function contentIsText(type?:string) {
   return [
      'text', 
      'text/html', 
      'text/markdown', 
      'application/json'
   ].some(t => (type??'text').indexOf(t) >=0 )
}

function createReadableStream(content:string) {
   return new ReadableStream({
      start(controller) {
         controller.enqueue(Uint8Array.from(content.split("").map(x => x.charCodeAt(0))));
      },
      pull(controller) {},
      cancel() {}
   })
}