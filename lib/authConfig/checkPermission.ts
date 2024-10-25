import { getServerSession }   from "next-auth";
import { Log }                from "lib/utils";
import { serverFindRoles }    from "lib/apps/serverFindRoles";
import { ALL_USERS, Role, RoleDesc }           
                              from "lib/apps/types";
import { authOptions }        from "./authOptions";

const log = Log(`checkPermission`)

export type Permissions = {
   fulfilled:  boolean
   user:       string
   requested:  Role[]
}
/**
 * checks the permissions of the currently logged in user against 
 * the provided `permissions`
 * @param permissions 
 */
export async function checkPermission(permissions:Role[]):Promise<Permissions> {
   const session = await getServerSession(authOptions)
   const roles:RoleDesc = await serverFindRoles()
   const user = session?.user?.name ?? ALL_USERS
   const hasPermission = permissions.includes(roles[user])
   if (hasPermission) {
      log.debug(`permissions for ${user}: ${roles[user]}, has one of the requested permission [${permissions.join(', ')}]`)
      return {
         user,
         requested:  permissions,
         fulfilled:  true,
      }
   } else {
      log.warn(`permissions for ${user}: ${roles[user]}, has none of the requested permissions [${permissions.join(', ')}]`)
      return {
         user,
         requested:  permissions,
         fulfilled:  false,
      }
   }
}


