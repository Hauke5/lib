import path                from 'path'
import { Log }             from '../utils/log';  
import fs, { Times }       from '../fileIO/server/fsUtil'
import { CachingImplementation, CachingOptions, Meta } 
                           from './cachedFetcher';

const log = Log('cachedServer')
// log.config({maxLength:120})


const cacheServerImplementation:CachingImplementation = {
   readCache, 
   writeCache, 
   removeCache, 
   cacheName
}

/** 
 * standard implementation of caching on server:
 * provides
 * - `readCache`  :  
 * - `writeCache` :
 * - `removeCache`:
 * - `cacheName`  :
 */
export default cacheServerImplementation

async function readCache(fname:string):Promise<{meta:Meta|undefined, content:string, times?:Times}> {
   try {
      const meta = fs.readJsonFileSync<Meta>(`${fname}-meta.json`); 
      if (!meta) return {meta, content:''}

      const content = fs.readFileSync(`${fname}.json`, true)
      const times = fs.pathTimesSync(`${fname}.json`)
      log.debug(`found cache for ${fname} `); 
      return {meta, content, times}
   } catch(e:any) {
      return {meta:undefined, content:''} // cache file not found
   }
}

async function writeCache(fname:string, meta:Meta, content:string) {
   fs.writeJsonFileSync(`${fname}-meta.json`, meta);
   fs.writeFileSync(`${fname}.json`, content, true);
   log.debug(()=>`writing cache for '${fname}.json'`)
}

async function removeCache(fname:string) {
   try {
      fs.removeSync(`${fname}-meta.json`)
      fs.removeSync(`${fname}.json`)
   } catch(e:any) {}
}


function cacheName(input: RequestInfo | URL, options:CachingOptions) {
   const cacheDir = options.cacheDest ?? ''
   const name = typeof input === 'string'? input : (input as Request).url ?? ((input as URL).pathname + (input as URL).search)
   const fname = path.resolve(cacheDir, name
      // .replace(/\//g,'-')  // replace  '/' with '-'
      .replace(/\?/g,'~')  // replace  '?' with '~'
      .replace(/:/g,'_'))  // replace  ':' with '_'
   log.debug(()=>`caching to '${fname}'`)
   return fname
}


