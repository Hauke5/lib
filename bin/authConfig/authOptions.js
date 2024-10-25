import { credentials } from './credentialProvider';
import { passKeys } from './passkeyProvider';
import { auth0 } from './auth0Provider';
export const authOptions = {
    providers: [
        passKeys,
        credentials,
        auth0,
    ],
    secret: '+hOOj1Unwn50XWTQpUZDIAmaZ8FAY3toinXnIdTG+t4=',
    pages: {
        signIn: '/api/signin',
        error: '/api/authError',
    }
};
