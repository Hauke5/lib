'use client'
import Link                from 'next/link'
import { signIn, signOut } 
                           from 'next-auth/react'
import { mdiAccountCog, mdiAccountGroup, mdiLogin, mdiLogout, mdiShieldAccount } 
                           from '@mdi/js'
import { Icon }            from '@hauke5/components/Icon'
import { Log }             from '@hauke5/lib/utils'
import styles              from './Auth.module.scss'
import { useAuthContext }  from './useAuthContext'

const log = Log(`SignedInAs`)

const roleIcons = {
   Admin:         mdiAccountCog,
   Owner:         mdiShieldAccount,
}

/**
 * Customized header to display on every page in case user is signed in.
 * After signing in, a user's role will be loaded from a `.roles.json` file in the `data/<appKey>/` directory.
 * @param props 
 * @returns a JSX.Element
 */
export function SignedInAs() {
   const {user, status, role}  = useAuthContext()
   
   const roleIcon = roleIcons[role as keyof typeof roleIcons] ?? mdiAccountGroup
   log.debug(`signed in as ${user?.username} with role ${role}`)

   return <div className={styles.signedIn}>
      <div className={styles.session}>
         <small>Signed in as</small>
         <span className={styles.user}>{user?.displayName} </span>            
      </div> 
      {roleIcon && <Icon mdi={roleIcon} className={`${styles.role} ${styles[role]}`} title={`${role} role`}/>}
      <div className={styles.button} >
         {status==='authenticated'
            ? <Icon mdi={mdiLogout} size={22} className={styles.signOut} onClick={()=>signOut({})} title='log out'/>
            : <Link href={`/api/signin`}>
               <Icon mdi={mdiLogin}  size={22} className={styles.signIn} onClick={()=>signIn()} title='sign in'/>
            </Link>
         }
      </div>
   </div>
}
