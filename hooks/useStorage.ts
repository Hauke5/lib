'use client'

import { Log }    from 'lib/utils/log'
import { useAppDesc } from '../apps'

const log = Log(`useStorage`)

export interface StorageType {
   setItem:    <ITEM=any>(key:string, value:ITEM)=>boolean
   getItem:    <ITEM=any>(key:string)=>ITEM|null
   removeItem: (key:string)=>void
}

export function useLocalStorage() {
   return useStorage('local')
}

export function useSessionStorage() {
   return useStorage('session')
}

export function getLocalStorage(appKey:string) {
   return getStorage('local', appKey)
}

export function getSessionStorage(appKey:string) {
   return getStorage('session', appKey)
}

function useStorage(storageType:'local'|'session'):StorageType  {
   const {key} = useAppDesc()
   return getStorage(storageType, key)
}

function getStorage(storageType:'local'|'session', appKey:string):StorageType  {
   const storage = getStorageByType(storageType)
   return {setItem, getItem, removeItem}

   function getItem<ITEM=any>(key:string):ITEM|null {
      if (!storage) {
         log.debug(()=>`no storage defined`)
         return null
      }
      try {
         const val = storage.getItem(`${appKey}-${key}`) ?? null
         if (val!==null) return JSON.parse(val) as ITEM
      } catch(e) {
         log.warn(`getting '${appKey}-${key}': ${e}`)
      }
      return null
   }
   /** sets an `item` for `key` and returns `true` if successful, `false` if not  */
   function setItem<ITEM=any>(key:string, value:ITEM):boolean {
      if (!storage) {
         log.debug(()=>`no storage defined`)
         return false
      }
      try {
         storage.setItem(`${appKey}-${key}`, JSON.stringify(value))
      } catch(e) {
         log.warn(`setting '${appKey}-${key}': ${e}`)
         return false
      }
      return true
   }
   function removeItem(key:string) {
      if (!storage) {
         log.debug(()=>`no storage defined`)
         return
      }
      storage.removeItem(`${appKey}-${key}`)
   }
}


function getStorageByType(storageType:'local'|'session') {
   if (typeof localStorage==='object')
   if (storageType==='local') {
      return localStorage
   } else if (storageType==='session') {
      return sessionStorage
   }
}
   