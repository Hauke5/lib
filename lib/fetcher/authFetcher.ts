import { createHash }   from 'crypto';
import { Fetch }        from "./fetcher"


export type AuthResponse = Response & {
}

type AuthFetch<R extends Response=Response> = Fetch<R & AuthResponse> 

export type AuthStrategy = {
   auth?:  AuthOptions
}

type Credentials = {
   username: string
   password: string
}

type AuthOptions = {
   credentials?:  Credentials    // user and password
   bearer?:       string         // bearer token
   token?:        string         // auth token
}


/**
 * Provides authorization mechanisms
 * @param strategy the `AuthStrategy` to use
 * @param _fetch optional `fetch` function; defaults to the standard system `fetch`
 * @returns a customized `fetch` function that follows the `PacingStrategy`
 */
export function authFetcher<R extends Response=Response>(strategy:AuthStrategy, _fetch:Fetch<R>):AuthFetch<R> {
   if (!strategy.auth) return _fetch as AuthFetch<R>

   return async (input: RequestInfo | URL, init?: RequestInit) => {
      const auth = strategy.auth!
      init ??= {}
      if (!init.headers) init.headers = {}
      defaultAuth(init, auth)
      let response = await _fetch(input, init) 
      const authHeader = (response.headers as unknown as Headers|{[key:string]:string}).has
         ? response.headers.get('WWW-Authenticate')
         : response.headers['WWW-Authenticate']
      if (response.status === 401 && authHeader) {
         requestedAuth(input, authHeader, init, auth)
         response = await _fetch(input, init)
      }
      return response as R & AuthResponse
   }

   /** set preemptively prior to each fetch  */
   function defaultAuth(init: RequestInit, auth:AuthOptions) {
      if (auth.bearer)      authBearer(auth.bearer, init)
      if (auth.token)       authToken(auth.token, init)
   }

   /** set after intitial fetch responded with 401 'WWW-Authenticate'  */
   function requestedAuth(input: RequestInfo | URL, authHeader:string, init: RequestInit, auth:AuthOptions) {
      if (auth.credentials) authCredentials(input, auth.credentials, authHeader, init)
   }
}


//-------- AuthToken
/** adds headers for basic authentication */
function authToken(token:string, init:RequestInit)   {
   init.headers!['AuthToken'] = token;
}

//-------- token Bearer Authorization
/** adds headers for basic authentication */
function authBearer(token:string, init:RequestInit)   {
   init.headers!['Authorization'] = `Bearer ${token}`
   init.headers!['Content-Type']  = `application/json`
   init.mode = 'cors'
}

//-------- basic auth with credentials
/** adds headers for basic authentication */
function authCredentials(input: RequestInfo | URL, credentials:Credentials, authHeader:string, init:RequestInit)   {
   const user = credentials.username 
   const pass = credentials.password
   if (user && pass) {
      if (authHeader.indexOf('Basic')===0) {
         init.headers!['Authorization']   = `Basic ${_btoa(`${user}:${pass}}`)}`
      } else if (authHeader.indexOf('Digest')===0) {
         init.headers!['Authorization']   = addDigest(input, credentials, authHeader, init)
         init.headers!['Accept']          = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
         init.headers!['Accept-Encoding'] = 'gzip, deflate';
   
      }
   }
}

function _btoa(str:string):string {
   const buffer = Buffer.from(str.toString(), 'binary');
   return buffer.toString('base64');
}


         
//-------- digest auth with credentials
let nc = 0;
const CNonce = "0a4f113b"  // client nonce

function addDigest(input: RequestInfo | URL, credentials:Credentials, authHeader:string, init:RequestInit) {
   const uri = typeof input === 'string'? input : (input as Request).url ?? (input as URL).toString()
   const challenge:any  = digestHeaderToChallenge(authHeader);
   challenge.username   = credentials.username
   challenge.uri        = uri
   challenge.algorithm  = "MD5"
   challenge.response   = createChallengeResponse(challenge, credentials, init)
   return compileParams(challenge)
}

function digestHeaderToChallenge(digestHeader:string) {
   digestHeader = digestHeader.split('Digest ')[1];
   const params = {};
   digestHeader.replace(/(\w*?=".*?"),?/g, (...rest:string[]) => {
      const part = rest[1];
      if (part) {
         const kv = part.split('=').map((v:string) => v.trim());
         params[kv[0]] = kv[1].replace(/\"/g, '');
      }
      return '';
   });
   return params;
}

function createChallengeResponse(challenge:any, credentials:Credentials, init:RequestInit) {
   generateCNONCE(challenge, CNonce)

   const ha1 = createHash('md5').update(`${credentials.username}:${challenge.realm}:${credentials.password}`).digest('hex')
   const ha2 = createHash('md5').update(`${init.method}:${challenge.uri}`).digest('hex')
   return createHash('md5').update(`${ha1}:${challenge.nonce}:${challenge.nc}:${challenge.cnonce}:${challenge.qop}:${ha2}`).digest('hex')
}

/**
 * Compose authorization header
 * @param params 
 */
function compileParams(params:any) {
   const putDoubleQuotes = (entry:string) => ['qop', 'nc'].indexOf(entry)<0;
   const parts:string[] = [];
   for (const i in params) {
      if (typeof params[i] !== 'function') {
         const param = i + '=' + (putDoubleQuotes(i) ? `"${params[i]}"` : params[i]);
         parts.push(param)
      }
   }
   return `Digest ${parts.join(',')}`
}


function updateNC():string {
   const max = 99999999;
   nc = (nc > max ? 1 : nc + 1);
   return (''+nc).padStart(8, '0')
}

/**
* Parse challenge digest
* @param qop 
*/
function generateCNONCE(challenge:any, cnonce?:string) {
   if (!challenge.qop || challenge.qop === 'auth' || challenge.qop.split(',')?.includes('auth')) {
      const cnonceHash = createHash('md5');
      cnonceHash.update(Math.random().toString(36));
      challenge.cnonce = cnonce ?? cnonceHash.digest('hex').substr(0, 16);
   }
   challenge.nc = updateNC()
}
         

