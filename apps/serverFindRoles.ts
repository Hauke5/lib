'use server'
import path          from 'path';
import * as fs       from 'lib/fileIO/fsUtil'
import { RoleDesc }  from 'lib/apps/types';
import { DataRoot }  from '../fileIO/initializeDataRoot';


const roleFile = '.roles.json'


/** returns the contents of the `.role.json` file in the `data` root  */
export async function serverFindRoles():Promise<RoleDesc> {
   const file =  path.join(DataRoot, roleFile)
   if (fs.isFileSync(file)) {
      const roleDesc:RoleDesc = fs.readJsonFileSync<RoleDesc>(file)
      return roleDesc
   } else {
      return {
         public: 'Public'
      } as RoleDesc
   }
}
