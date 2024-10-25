'use client'
import { MutableRefObject, useEffect, useRef, useState }
   from "react"
import { Log } from '../utils/log'; const log = Log('useResizer')


export interface Resizer {
   viewport: { height: number, width: number }
}


/** 
 * listens to resize events on the element referenced on the returned `domRef` variable 
 * and triggers a redraw when a resize happens.
 */
export function useResizer<T extends Element>(): { domRef: MutableRefObject<T|null>, viewport: { height: number, width: number } } {
   const domRef = useRef<T|null>(null)
   const [viewport, setViewport] = useState<{ height: number, width: number }>({ width: 500, height: 500 })
   useEffect(() => {
      if (domRef.current) {
         const ref = domRef.current
         domRef.current.addEventListener('resize', ()=>resizeListener('domRef'));
         window.addEventListener('resize', ()=>resizeListener('window'))
         resizeListener('initial')
         return () => ref.removeEventListener('resize', ()=>resizeListener);  // clean up function
      }

      function resizeListener(source:string) {
         if (domRef.current) {
            const d = domRef.current.getBoundingClientRect().toJSON()
            if (d && (viewport.height!==d.height || viewport.width!==d.width)) {
               setViewport({ height: Math.round(d?.height), width: Math.round(d?.width) })
            }
         }
      }
   }, [viewport.height, viewport.width])    // run once `domRef` is intialized

   return { domRef, viewport }

}

