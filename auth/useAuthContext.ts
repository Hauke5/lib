import { useContext }   from "react";
import { authContext, AuthContext } 
                        from "./AuthContext";



/**
 * provides the name of the user currently authorized via next-auth, 
 * or ALL_USERS if no one is logged in
 */
export function useAuthContext():AuthContext {
   const context = useContext(authContext)
   if (!context) throw Error(`useAuthContext is called outside the context`)
   return context
}

