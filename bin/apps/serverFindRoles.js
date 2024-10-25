'use server';
import path from 'path';
import * as fs from 'lib/fileIO/server/fsUtil';
import { DataRoot } from 'lib/fileIO/server/initializeDataRoot';
const roleFile = '.roles.json';
/** returns the contents of the `.role.json` file in the `data` root  */
export async function serverFindRoles() {
    const file = path.join(DataRoot, roleFile);
    if (fs.isFileSync(file)) {
        const roleDesc = fs.readJsonFileSync(file);
        return roleDesc;
    }
    else {
        return {
            public: 'Public'
        };
    }
}
