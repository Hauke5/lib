import CredentialsProvider from 'next-auth/providers/credentials'
import process             from 'process'
import crypto              from 'crypto'
import path                from 'path'
import {readJsonFileSync}  from 'lib/fileIO/server/fsUtil'
import { Log }             from 'lib/utils'

const log = Log(`credentialProvider`)

type CredentialData = Record<"username" | "password", string> | undefined

interface PasswordFile {
   [user:string]: string
}

export const credentials = CredentialsProvider({
   // The name to display on the sign in form (e.g. 'Sign in with...')
   name: 'Credentials',
   id:   'credentials',
   // The credentials is used to generate a suitable form on the sign in page.
   // You can specify whatever fields you are expecting to be submitted.
   // e.g. domain, username, password, 2FA token, etc.
   credentials: {
      username: { label: "Username", type: "text" },
      password: { label: "Password", type: "password" }
   },
   async authorize(credentials:CredentialData) {
      const user = credentials?.username ?? '?'
      try {
         const root = path.join(process.cwd(),'./data')
         const passwordFile = path.join(root, './passwd.json')
         console.info(`CredentialsProvider authorizing via '${passwordFile}'`)
   
         const hash = crypto.createHash('sha256');
         hash.update(credentials?.password ?? '');
         const pw = hash.digest('hex');

         const users = readJsonFileSync<PasswordFile>(passwordFile)

         if (users?.[user] === pw) {
            log.info(`CredentialsProvider validated user ${user}`)
            return { name: user, id:user}
         } else {
            log.error(`CredentialsProvider invalid password for user ${user}; new hash = '${pw}'`)
            throw Error(`CredentialsProvider invalid input`)
            return null
         }
      } catch(e:any) {
         console.warn(`CredentialsProvider error authenticating ${user}: ${e}`)
      }
      return null
   } 
})

