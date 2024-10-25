import path          from "path"
import fs            from 'lib/fileIO/server/fsUtil'

export const DataRoot = path.join(process.cwd(),'./data')

export function initializeDataRoot() {
   const rootPath = path.join(DataRoot, `./`)
   const exists = fs.isDirectorySync(rootPath)
   if (!exists) createDataroot()
}

function createDataroot() {
   console.log(`no data root, initializing...`)
   fs.mkdirsSync(DataRoot)
   console.log(`...data folder created`)
   const rolesJson = path.join(DataRoot, `./.roles.json`)
   fs.writeJsonFileSync(rolesJson, {
      "public":  "Public"
   })
   console.log(`... .roles.json added, with user 'public' in 'Public' role`)
   console.log(`... no .access.json added`)
}