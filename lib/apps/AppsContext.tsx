'use client'
import { createContext }      from "react";
import { UpdateContext }      from "lib/hooks";
import { AppDesc }            from "./useAppDesc";
import { ChildrenOnlyProps, RoleDesc }  
                              from "./types";

export type AppsContext =  {
   apps:       AppDesc[]
   roles:      RoleDesc
}


export const appsContext = createContext<AppsContext|null>(null)

type AppsContextProps = ChildrenOnlyProps & {
   appDescs:   AppDesc[]
   roles:      RoleDesc
}
/** provides a `context` that lists all available apps. */
export function AppsContext({children, appDescs, roles}:AppsContextProps) {
   return <appsContext.Provider value={{apps:appDescs, roles}}>
      {children}
   </appsContext.Provider>
}


type ContextUpdate<CONTEXT extends {}> = {
   updateContext: UpdateContext<CONTEXT>
}

/**
 * creates a `reactContext`, augmented with an `updateContext` function that allows 
 * for partial updates to the state
 */
export function createAppStateContext<CONTEXT extends {}>() {
   return createContext<(CONTEXT & ContextUpdate<CONTEXT>)|null>(null)
}

