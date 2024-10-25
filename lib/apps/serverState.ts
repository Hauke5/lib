import { Log } from "lib/utils"

const log = Log(`serverState`)

/**
 * Provides a space (an object of type `TYPE`) to store server-side state information.
 * The space will be created inside the `helpfulScripts` extension of `globalThis`, as in
 * ```
 * globalThis.helpfulScripts[appField]
 * ```
 * @param appField the field name to 
 * @returns 
 */
export function serverState<TYPE>(appField:string):TYPE {
   // find or intialize the global `helpfulScripts` state space
   const hsGlobals = globalThis.helpfulScripts = globalThis.helpfulScripts ?? {}
   if (!hsGlobals[appField]) {
      log(`>> setting new global server state '${appField}'`)
      // initialize the requested `appField`
      hsGlobals[appField] = {}
   }
   // and return the `appField`
   return hsGlobals[appField] as TYPE
}
