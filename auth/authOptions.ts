
/**
 * Server-side `authOptions`
 */
import { NextAuthOptions } from 'next-auth';
import { credentials}      from './credentialProvider'
import { passKeys}         from './passkeyProvider'
import { auth0}            from './auth0Provider'


export const authOptions:NextAuthOptions = {
   providers: [
      passKeys,
      credentials,
      auth0,
   ],
   secret: '+hOOj1Unwn50XWTQpUZDIAmaZ8FAY3toinXnIdTG+t4=',
   pages: {
      signIn: '/api/signin',
      error:  '/api/authError',
   }
}


export type Provider = {
   id:      string
   name:    string
   style?:  any
}
