# libraries for use with @hauke5 apps in NextJS

## apps
support for multi-app launch pages
- `AppsContext`: provides a context for the currently running app, as well as `roles` defined for the app.
- `AppTitleBar`: a title bar, showing the currently running app name and login-status information, with provisions to add app-specific items such as tabs, etc.
- `useAppDesc`: provides information on the currently running app to components.
- `useAppsContext`: used in conjunction with `AppsContext`
- `useGitBranch`: provided information on the currently active git branch in the CWD
- `serverState`: provides a server-side status mechanism.

## authConfig
support for `next-auth`-based authentication in apps and components.
- `checkPermission`: checks the permissions of the currently logged in user against the provided `permissions` roles
- `authOptions`: configuration structure for `next-auth`

## db
database support functions
Currently implemented DB adapters:
- prisma

## errors
support for using `ErrorBoundarys`

## fetcher
utility to provide a `fetch` function that supports caching, pacing, and authentications

## fileIO
provides sandboxed fileIO operations on the server to browser components.

## hooks
a collection of hooks for use by apps and components

## utils
a collection of utility functions for use by apps and components. See the `readme.md` inside the `utils` folder

