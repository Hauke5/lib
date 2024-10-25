import { useEffect, useRef, useState }     
                        from "react";
import { formatDate }   from "lib/utils";
import { getNewestGitBranch, getRunningGitBranch } 
                        from "./getGitBranch";
import styles           from './appStyles.module.scss'


const VersionUpdateInterval = 10*60*1000   // every 10 min

/** formats the next-check-date as a time */
const format = (date:Date) => formatDate('%hh:%mm:%ss', date)

/** formats the title string to display */
const getTitle = (version:string, nextCheck:Date|null, title?:string) =>
   `git branch ${version} ${nextCheck?`\nnext check @${format(nextCheck)}`:''}${title?`\n${title}`:''}`

/** 
 * regularly checks the status of the latest git branch and presents 
 * an update button when a new version is available.  
 */
export function useGitBranch(title?:string) {
   const [newVersion, setVersion]   = useState('')
   const [newTitle, setTitle]       = useState('')
   const nextCheckTimeRef           = useRef<Date|null>(null)

   useEffect(() => {
      let timer:NodeJS.Timeout
      check() // check git and start timer loop
      return () => timer? clearTimeout(timer) : undefined

      async function check() {
         const latest  = await getNewestGitBranch()
         const current = await getRunningGitBranch()
         setTimer()
         setTitle(getTitle(current, nextCheckTimeRef.current, title))

         console.log(`checking branch ${current} -> ${latest}`)
         if (current !== latest) {
            setVersion(`Version ${latest} available.\nPlease reload.`)
         }
      }
      function setTimer() {
         nextCheckTimeRef.current = new Date()
         nextCheckTimeRef.current.setMilliseconds(nextCheckTimeRef.current.getMilliseconds() + VersionUpdateInterval)
         timer = setTimeout(check, VersionUpdateInterval)
      }
   }, [title])

   const updateButton = newVersion && <div className={styles.newGitVersion} onClick={window.location.reload} title={newVersion}>{newVersion}</div>

   return { newTitle, updateButton }
}


