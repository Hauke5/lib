'use client';
import { useRef, useState } from "react";
export function useContextState(initialContext) {
    const updateCxt = useRef(updateContext);
    const [context, setContext] = useState(initialContext);
    return { context, updateContext: updateCxt.current };
    function updateContext(newContext) {
        setContext(current => Object.assign({}, current, newContext));
    }
}
