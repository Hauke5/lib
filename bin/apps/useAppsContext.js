import { useContext } from "react";
import { appsContext } from "./AppsContext";
export function useAppsContext() {
    const context = useContext(appsContext);
    if (!context)
        throw Error(`useAppsContext is called outside the context`);
    return context;
}
