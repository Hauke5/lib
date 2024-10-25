## File API

### Access Management
Per default, all types of access to folders within the `data` root folder of the nextjs server instance are available to all users.
Access outside the `data` root folder is prohibited.

#### Type of permissions
Privileges are granted to a set of users as follows:
- `read` access allows the user to read the requested file (both hidden and non-hidden) or query details on the requested directory
- `write` access allows the user to create, and write to, a file; without `grant` access, `write` access will only be granted for 
non-hidden files (i.e. files whose names do not start with a period `.`)
- `grant` access allows a user to change hidden files (such as `.access.json` itself). User `public` is always denied `grant` permission.

The user names in this file will be matched with the user currently authorized by `next-auth`.
In addition, a public user (`public`) can be configured to determine permissions for cases where no user is logged in. The final level of permissions for a user will always be at least as permissive as those of `public`.

#### Access Control Files
Access permissions can be progressively limited (but not broadened) on per-folder basis along the folder tree within the `data` root folder by placing a `.access.json` Access Control File (ACF) inside a folder. The following entries are defined, and each entry is optional:
```json
{
   "read": [<list of next-auth user names>],
   "write":[<list of next-auth user names>],
   "grant":[<list of next-auth user names>]
}
```

- ACFs are evaluated from the `data` root to the folder of the file for which access is requested.
- All users must initially be defined in the first encountered ACF in the hierarchy tree.
- Along that path, the initial access rights of a user can be further restricted, but not broadened.
- Permissions type in an ACF are optional. If defined, any user not mentioned in the list loses the respective permission for the folder and any enclosed subfolders.

### Sandboxing