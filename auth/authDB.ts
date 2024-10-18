'use server'
import path    from "path"
import { readJsonFile, writeJsonFile } 
               from "../fileIO/fsUtil"
import { Log } from "../utils"


const log = Log(`authDB`)

const CredentialFile = path.join(process.cwd(),'data/.credentialsDB.json')

export type Base64 = string
export type DBUser = {
   id:            Base64
   email:         string
   username:      string
   displayName:   string
}
               
type DBRegistration = {
   user:    DBUser
   passIds: Base64[]
}
type DBUsers = {[username:string]:DBRegistration}
               
export async function dbGetUserByUsername(username:string): Promise<DBRegistration|null> {
   const users = await readUsers()
   log(`get user '${username}': ${users[username]?'found':'not found'}`)
   return users[username] ?? null
}

export async function dbSetUserByUsername(user:DBUser, passId:Base64) {
   const users = await readUsers()
   const name = user.username
   if (!users[name]) 
      users[name] = {user, passIds:[]}
   if (!users[name].passIds.includes(passId)) 
      users[name].passIds.push(passId)
   writeUsers(users)
}

async function readUsers() {
   try {
      const users = await readJsonFile(CredentialFile) as DBUsers
      log.debug(`reading users:`, users)
      return users
   } catch(e) {
      // no credential file yet
      return {}
   }
}

async function writeUsers(users:DBUsers) {
   await writeJsonFile(CredentialFile, users)
   log(`updated users`)
}

