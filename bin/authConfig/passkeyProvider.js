import CredentialsProvider from 'next-auth/providers/credentials';
import { Log } from 'lib/utils';
const log = Log(`passKeyProvider`);
export const passKeys = CredentialsProvider({
    // The name to display on the sign in form (e.g. 'Sign in with...')
    name: 'Passkeys',
    id: 'passkeys',
    // The credentials is used to generate a suitable form on the sign in page.
    // You can specify whatever fields you are expecting to be submitted.
    // e.g. domain, username, password, 2FA token, etc.
    credentials: {
        email: { label: "Email", type: "text" },
        name: { label: "Name", type: "text" },
    },
    authorize: async (credentials) => {
        const name = credentials?.name ?? '?';
        log(`authorizing passkeys for '${credentials?.name} (${credentials?.email})'`, credentials);
        try {
            log(`logging in user ${name}`);
            return { name: credentials.name, id: credentials.email };
        }
        catch (e) {
            log.warn(`CredentialsProvider error: ${e}`);
        }
        return null;
    }
});
