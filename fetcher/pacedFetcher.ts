import { Log }          from '../utils/log';   
import { pacing, PacingProps }  
                        from '../utils/timing';
import { Fetch }        from './fetcher';

export type PacedResponse = Response & {
   pacing?: {
      queued:     Date,
      started:    Date,
      completed:  Date,
   }
}

export type PacingStrategy = {
   pacing?:  PacingProps
}

const log = Log('pacedFetch')
log.config({maxLength:120})

type PacedFetch<R extends Response=Response> = (input: RequestInfo | URL, init?: RequestInit) => Promise<R & PacedResponse>

/**
 * Provides a pacing mechanism
 * @param strategy the `PacingStrategy` to use
 * @param _fetch optional `fetch` function; defaults to the standard system `fetch`
 * @returns a customized `fetch` function that follows the `PacingStrategy`
 */
export function pacedFetcher<R extends Response>(strategy:PacingStrategy, _fetch:Fetch<R>):PacedFetch<R> {
   if (!strategy.pacing) return _fetch as PacedFetch<R>
   if (!strategy.pacing.pace) strategy.pacing.pace = 100
   const queue = pacing<R & PacedResponse>(strategy.pacing)
   const timings = {} as Required<PacedResponse>['pacing']
   
   return async (input: RequestInfo | URL, init?: RequestInit) => {
      log.debug(()=>`(queue=${queue.inQueue()} | sent=${queue.inProgress()}) queued ${init?.method??'GET'} ${input}`); 
      timings.queued = new Date()
      const key = input.toString()
      return (await queue.add(async () => {
         timings.started = new Date()
         const delay = timings.started.getTime()-timings.queued.getTime()
         log.debug(()=>`(queue=${queue.inQueue()} | sent=${queue.inProgress()}) ${delay}ms calling ${init?.method??'GET'} ${input}`); 
         const result = await _fetch(input, init) as R & PacedResponse
         log.info(()=>`(queue=${queue.inQueue()} | sent=${queue.inProgress()}) received ${init?.method??'GET'} ${result.status} ${input}`); 
         timings.completed = new Date()
         result.pacing = timings
         return result
      }, key))?.actionOutcome
   }
}



