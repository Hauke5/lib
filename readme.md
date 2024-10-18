# libraries for use with @hauke5 apps in NextJS

## apps
support for multi-app launch pages
- `AppsContext`: provides a context for the currently running app, as well as `roles` defined for the app.
- `AppTitleBar`: a title bar, showing the currently running app name and login-status information, with provisions to add app-specific items such as tabs, etc.
- `useAppDesc`: provides information on the currently running app to components.
- `useAppsContext`: used in conjunction with `AppsContext`
- `useGitBranch`: provided information on the currently active git branch in the CWD
- `serverState`: provides a server-side status mechanism.

## auth
support for `next-auth`-based authentication in apps and components.
- `SignedInAs`: component to show the currently logged in user and their role.
- `SignInPage`: custom sign-in page
- `AuthContext`: provides the authetication context to pages and components
- `useAuthContext`: used in conjunction with `AuthContext`
- `useAuthorizedUserName`: shorthand hook to directly retrieve the name of the logged in user

## db
database support functions
Currently implemented DB adapters:
- prisma

## errors
support for using `ErrorBoundarys`

## fetcher

