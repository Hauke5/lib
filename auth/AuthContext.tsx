import { createContext, useEffect, useState } 
                                    from "react"
import { useSession }               from "next-auth/react"
import { useAppsContext }           from "../apps"
import { BaseProps }                from "../../components/BaseProps"
import { Log }                      from "../utils"
import { dbGetUserByUsername, DBUser } 
                                    from "./authDB"
import { generateUniqueBase64ID }   from "./passkeysClient"
import { ALL_USERS, Role }          from "../apps/types"

const log = Log(`AuthContext`)

export type AuthContext = {
   user:       DBUser
   role:       Role
   status:     "authenticated" | "loading" | "unauthenticated"
}

const PublicUser:DBUser = {
   username:      ALL_USERS,
   displayName:   'Public',
   email:         '',
   id:            generateUniqueBase64ID(ALL_USERS),
}


export const authContext = createContext<AuthContext|null>(null)

export function AuthContext({children}:BaseProps) {
   const {roles}           = useAppsContext()
   const {data, status }   = useSession()
   const username = data?.user?.name ?? ALL_USERS
   const [user, setUser]   = useState<DBUser>(PublicUser)
   const [role, setRole]   = useState<Role>(roles[username])
   useEffect(()=>{
      if (username)
         dbGetUserByUsername(username)
            .then(registration => {
               log.debug(`user registered ${registration?.user.username}`)
               if (registration?.user) {
                  setUser(registration.user)
                  setRole(roles[registration.user.username])
               }
            })
   },[username, roles])
   return <authContext.Provider value={{user, role, status}}>
      {children}
   </authContext.Provider>
}