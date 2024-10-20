'use client'
import Link                      from 'next/link'
import { mdiHomeImportOutline }  from '@mdi/js'
import { SignedInAs }            from '@hauke5/lib/auth/SignedInAs'
import { Icon }                  from '@hauke5/components/Icon'
import { useAppDesc }            from '@hauke5/lib/apps/useAppDesc'
import { ErrorBoundarySuspense } from '@hauke5/lib/errors/ErrorBoundary'
import { BaseProps }             from '@hauke5/components/BaseProps'
import styles                    from './AppTitleBar.module.scss'
import { useGitBranch } from '@hauke5/lib/apps/useGitBranch'


export interface AppTitleBarProps extends BaseProps {
   /** [<middle element>, <right-hand controls>] */
   // children?:  ReactNode | ReactNode[] 
   auth?:      boolean
}


/**
 * Shows the app title bar, consisting of
 * - the app `title` on the left
 * - app-specific `children` in the middle
 * - app-specific `controls`, e.g. authentication information along with a sign-out (if `auth` is `true`), and a home button on the right
 * @param param0 
 * - children: any React children to display in the middle of the title bar row
 * - `auth`: (default=`false`); if `true`, show the authenticated user, role and sign-out button
 */
export function AppTitleBar({children, auth=false, title}:AppTitleBarProps) {
   const appDesc                             = useAppDesc()
   const {newTitle, updateButton}            = useGitBranch(title)

   return <ErrorBoundarySuspense what={`AppTitleBar`}>
      {appDesc
         ? <div className={styles.titleBar} >
               <div className={styles.title} title={newTitle}>{appDesc.title ?? '*'}</div>
               {children ?? <div style={{width:'100%'}}></div>}
               {updateButton}
               <div className={styles.right}>
                  {auth && <SignedInAs />}
                  <Link className={styles.home} href='/'><Icon mdi={mdiHomeImportOutline}  title='home page'/></Link>
               </div>
         </div>
         : <div className={styles.titleBar} >
            No App Selected
         </div>
      }
   </ErrorBoundarySuspense>
}

