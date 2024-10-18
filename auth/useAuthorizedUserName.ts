import { useSession }   from "next-auth/react";
import { ALL_USERS }    from "../apps/types";



/**
 * provides the name of the user currently authorized via next-auth, 
 * or ALL_USERS if no one is logged in
 */
export function useAuthorizedUserName():string {
   const session = useSession()
   return session.data?.user?.name ?? ALL_USERS
}

