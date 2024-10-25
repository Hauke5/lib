'use client';
import { createContext } from "react";
export const appsContext = createContext(null);
/** provides a `context` that lists all available apps. */
export function AppsContext({ children, appDescs, roles }) {
    return <appsContext.Provider value={{ apps: appDescs, roles }}>
      {children}
   </appsContext.Provider>;
}
/**
 * creates a `reactContext`, augmented with an `updateContext` function that allows
 * for partial updates to the state
 */
export function createAppStateContext() {
    return createContext(null);
}
