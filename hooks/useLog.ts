/**
 * ## useLog
 * provides react hooks to accesss the `log` utility.
 * - useLog logs to stdout
 * - useFileLog logs to stdout and appends a line to a log file at the specified `urlBase`.
 * 
 */
'use client'
import { useRef }          from 'react'
import { Log, LogOptions } from 'lib/utils/log'


export function useLog(prefix:string, options?: Partial<LogOptions>) {
   const log = useRef(Log(prefix, options))
   return log.current
}

