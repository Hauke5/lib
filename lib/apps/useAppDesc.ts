'use client'
import { usePathname }     from 'next/navigation';
import { ReactNode, useEffect, useRef }       
                           from 'react';
import { useAppsContext }  from './useAppsContext';

export interface AppDesc {
   key:     string
   title:   ReactNode
   desc:    string
   color:   string
   hide?:   boolean
}


/** returns the app descriptor that matches the current filePath */
export function useAppDesc():AppDesc {
   const {apps}   = useAppsContext()
   const path     = usePathname()
   const desc     = useRef(getDesc(apps, path))
   useEffect(()=>{
      desc.current = getDesc(apps, path)
   },[apps, path])
   return desc.current
}

function getDesc(apps:AppDesc[], path:string) {
   const appKey = path?.split('/')[1]
   return apps.find(desc => desc.key===appKey) ?? {key:appKey, title:'', desc:'', color:''}
}