'use server'
import { exec }        from 'child_process';
import { serverState } from './serverState';

/** 
 * server function that returns the active git branch of the 
 * current working directory 
 */
export async function getNewestGitBranch():Promise<string> {
   return new Promise(resolve => {
      exec('git rev-parse --abbrev-ref HEAD', (err, stdout) => {
         if (err) {
            console.log(`error identifying git branch: ${err}`)
            resolve('???')
         }
         if (typeof stdout === 'string') {
            console.log(`sending git branch ${stdout.trim()}`)
            resolve(stdout.trim())
         }
         resolve('???')
      });
   })
}

/** 
 * server function that returns a previously stored value for the active git branch of the 
 * current working directory.
 */
export async function getRunningGitBranch():Promise<string> {
   const running = serverState<{current:string}>('runningGitBranch')
   if (!running.current) {
      running.current = await getNewestGitBranch()
   }
   return running.current
}