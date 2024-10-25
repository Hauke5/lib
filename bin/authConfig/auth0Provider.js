import Auth0Provider from "next-auth/providers/auth0";
import process from 'process';
export const auth0 = Auth0Provider({
    clientId: process.env.AUTH0_CLIENT_ID ?? '',
    clientSecret: process.env.AUTH0_CLIENT_SECRET ?? '',
    issuer: process.env.AUTH0_ISSUER
});
