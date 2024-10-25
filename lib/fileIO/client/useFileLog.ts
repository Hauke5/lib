import { useAppDesc }      from "lib/apps"
import { formatDate, IoChannels, Log }      
                           from "lib/utils"
import { serverTextWrite } from "../server/serverFileIO"


export function useFileLog(prefix:string, dir:string) {
   const {key}    = useAppDesc()
   return log(key, prefix, dir)
}


export function FileLog(apiKey:string, prefix:string, file:string) {
   return log(apiKey, prefix, file)
}

function log(appKey:string, prefix:string, dir:string) {
   const localLog = Log(prefix, {INFO: ['darkmagenta', 'bold']})
   const fileLog = Log(prefix)
   const file = `${dir}/${formatDate(fileLog.config().dateFormat)}`
   const io:IoChannels = {
      DEBUG:(msg:string)=>serverTextWrite(appKey, file, msg, {append:true}),
      INFO: (msg:string)=>serverTextWrite(appKey, file, msg, {append:true}),
      WARN: (msg:string)=>serverTextWrite(appKey, file, msg, {append:true}),
      ERROR:(msg:string)=>serverTextWrite(appKey, file, msg, {append:true}),
   }
   fileLog.config({useColors:false}, io)
   return {record}

   /**
    * reports an info message to the log and adds an entry to a server-side log. 
    * The message will actually be reported to the log only if the current 
    * reporting level is DEBUG or lower.
    * @param msg the message to report. For msg types, refer to [info](utils.FileLog.FileLog.info).
    * @return the message printed
    */
   function record(msg:any) { 
      localLog(msg)
      fileLog(msg)
   }
}

