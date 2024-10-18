import { useRef }       from "react"
import { getDebouncer } from "@hauke5/lib/utils/timing"


export function useDebounce() {
   const debounce = useRef(getDebouncer())
   return debounce.current
}