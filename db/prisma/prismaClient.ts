import { serverState }     from "lib/apps/serverState"
import { checkPermission } from "lib/auth/checkPermission"
import { Role }            from "lib/apps/types"
import { Log }             from "lib/utils"


const log            = Log(`prismaClient`)
const PRISMA_GLOBAL  = 'prismaGlobal'

export type DBConfig = {
   host:       string
   port:       number
   database:   string
}


function getDBEnvConfig():Omit<DBConfig, 'database'> {
   const port = process.env.SQL_PORT? +process.env.SQL_PORT : 3306
   const host = process.env.SQL_HOST ?? 'invalid'
   return {host, port }
}

export type PrismaGlobal<T> = {
   config:  DBConfig
   prisma:  T 
}

export type PrismaDBs = {
   [database:string]: PrismaGlobal<any>
}

export class DBAccessError extends Error {}

/**
 * the central function providing Prisma access functions to the SQL DB 
 * Each call to this function, as well as the individual access functions triggers a 
 * check of user authentication and permissions check
 * @param database the name of the database to connect to
 * @param requiredRoles a list of roles authorizing the authenticated user to have access to the DB. 
 * This is an OR list, i.e. if the user has any of the roles, access will be granted
 * @param createPrisma function that creates the app-specific PrismaClient
 * @returns the `PrismaGlobal` structure for the `database`
 * @throws
 */
export async function getDBPrisma<T>(database:string, requiredRoles: Role[], createPrisma:(url:string)=>T):Promise<PrismaGlobal<T>> {
   const permissions = await checkPermission(requiredRoles)
   if (!permissions.fulfilled) {
      log.warn(`attempt to connect to SQL '${database}' as '${permissions.user}' without required permission`)
      throw new DBAccessError(`attempt to connect to SQL '${database}' as '${permissions.user}' without required permission`)
   } else {
      // user has permission: provide access to database
      log.info(`user ${permissions.user} has permissions: ${permissions.fulfilled}`)
      return globalPrisma<T>(database, createPrisma)
   }
}


/**
 * server-side function to setup a Prisma DB connector and store it in a global state. 
 * Each value of `databaseName` will have its own connection and storage space.
 * **Important**: The calling function is responsible for ensuring that access to the database
 * is properly authorized. `globalPrisma` will make no attempt to authorize access.
 * @param database the name of the database for which the connection will be created. 
 * host and port for the connection will be read from the environment
 * @param createPrisma function that creates the app-specific PrismaClient
 * @returns a populated `PrismaGlobal` object for `databaseName`
 */
function globalPrisma<T>(database:string, createPrisma:(url:string)=>T) {
   const prismaGlobal = serverState<PrismaGlobal<T>>(PRISMA_GLOBAL)

   if (!prismaGlobal[database]) {
      log(`*** creating prisma DB connection for '${database}'`)
      const {host, port} = getDBEnvConfig()
      const user  = process.env.SQL_USER
      const pw    = process.env.SQL_PW
      const url   = `mysql://${user}:${pw}@${host}:${port}/${database}`
      prismaGlobal[database] = {
         prisma:  createPrisma(url),
         config:  {
            host, port, database: database
         }
      }
   }
   return prismaGlobal[database]
}
