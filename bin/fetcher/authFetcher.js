import { createHash } from 'crypto';
/**
 * Provides authorization mechanisms
 * @param strategy the `AuthStrategy` to use
 * @param _fetch optional `fetch` function; defaults to the standard system `fetch`
 * @returns a customized `fetch` function that follows the `PacingStrategy`
 */
export function authFetcher(strategy, _fetch) {
    if (!strategy.auth)
        return _fetch;
    return async (input, init) => {
        const auth = strategy.auth;
        init ??= {};
        if (!init.headers)
            init.headers = {};
        defaultAuth(init, auth);
        let response = await _fetch(input, init);
        const authHeader = response.headers.has
            ? response.headers.get('WWW-Authenticate')
            : response.headers['WWW-Authenticate'];
        if (response.status === 401 && authHeader) {
            requestedAuth(input, authHeader, init, auth);
            response = await _fetch(input, init);
        }
        return response;
    };
    /** set preemptively prior to each fetch  */
    function defaultAuth(init, auth) {
        if (auth.bearer)
            authBearer(auth.bearer, init);
        if (auth.token)
            authToken(auth.token, init);
    }
    /** set after intitial fetch responded with 401 'WWW-Authenticate'  */
    function requestedAuth(input, authHeader, init, auth) {
        if (auth.credentials)
            authCredentials(input, auth.credentials, authHeader, init);
    }
}
//-------- AuthToken
/** adds headers for basic authentication */
function authToken(token, init) {
    init.headers['AuthToken'] = token;
}
//-------- token Bearer Authorization
/** adds headers for basic authentication */
function authBearer(token, init) {
    init.headers['Authorization'] = `Bearer ${token}`;
    init.headers['Content-Type'] = `application/json`;
    init.mode = 'cors';
}
//-------- basic auth with credentials
/** adds headers for basic authentication */
function authCredentials(input, credentials, authHeader, init) {
    const user = credentials.username;
    const pass = credentials.password;
    if (user && pass) {
        if (authHeader.indexOf('Basic') === 0) {
            init.headers['Authorization'] = `Basic ${_btoa(`${user}:${pass}}`)}`;
        }
        else if (authHeader.indexOf('Digest') === 0) {
            init.headers['Authorization'] = addDigest(input, credentials, authHeader, init);
            init.headers['Accept'] = 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8';
            init.headers['Accept-Encoding'] = 'gzip, deflate';
        }
    }
}
function _btoa(str) {
    const buffer = Buffer.from(str.toString(), 'binary');
    return buffer.toString('base64');
}
//-------- digest auth with credentials
let nc = 0;
const CNonce = "0a4f113b"; // client nonce
function addDigest(input, credentials, authHeader, init) {
    const uri = typeof input === 'string' ? input : input.url ?? input.toString();
    const challenge = digestHeaderToChallenge(authHeader);
    challenge.username = credentials.username;
    challenge.uri = uri;
    challenge.algorithm = "MD5";
    challenge.response = createChallengeResponse(challenge, credentials, init);
    return compileParams(challenge);
}
function digestHeaderToChallenge(digestHeader) {
    digestHeader = digestHeader.split('Digest ')[1];
    const params = {};
    digestHeader.replace(/(\w*?=".*?"),?/g, (...rest) => {
        const part = rest[1];
        if (part) {
            const kv = part.split('=').map((v) => v.trim());
            params[kv[0]] = kv[1].replace(/\"/g, '');
        }
        return '';
    });
    return params;
}
function createChallengeResponse(challenge, credentials, init) {
    generateCNONCE(challenge, CNonce);
    const ha1 = createHash('md5').update(`${credentials.username}:${challenge.realm}:${credentials.password}`).digest('hex');
    const ha2 = createHash('md5').update(`${init.method}:${challenge.uri}`).digest('hex');
    return createHash('md5').update(`${ha1}:${challenge.nonce}:${challenge.nc}:${challenge.cnonce}:${challenge.qop}:${ha2}`).digest('hex');
}
/**
 * Compose authorization header
 * @param params
 */
function compileParams(params) {
    const putDoubleQuotes = (entry) => ['qop', 'nc'].indexOf(entry) < 0;
    const parts = [];
    for (const i in params) {
        if (typeof params[i] !== 'function') {
            const param = i + '=' + (putDoubleQuotes(i) ? `"${params[i]}"` : params[i]);
            parts.push(param);
        }
    }
    return `Digest ${parts.join(',')}`;
}
function updateNC() {
    const max = 99999999;
    nc = (nc > max ? 1 : nc + 1);
    return ('' + nc).padStart(8, '0');
}
/**
* Parse challenge digest
* @param qop
*/
function generateCNONCE(challenge, cnonce) {
    if (!challenge.qop || challenge.qop === 'auth' || challenge.qop.split(',')?.includes('auth')) {
        const cnonceHash = createHash('md5');
        cnonceHash.update(Math.random().toString(36));
        challenge.cnonce = cnonce ?? cnonceHash.digest('hex').substr(0, 16);
    }
    challenge.nc = updateNC();
}
