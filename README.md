<!-- README.md is auto-generated. See src/readme.hbs -->

# npm-api-client

A self-generating client for npm's new registry API

**Note: This client was designed to work with a private API that is only accessible to employees of npm, Inc. If that API is ever made public, this client will become relevant/useful.**

## Basic Usage

```js
var npm = require('acl-client')()

npm.packages.get('browserify')
  .then(function(pkg){ /* yay */ })
  .catch(function(err){ /* oof */ })
```

- The client is stateless and has zero configuration.
- All operations return a [request](http://npm.im/request) request wrapped in a promise.
- To override the default host of `api.npmjs.com` set `process.env.ACL_CLIENT_HOST`.

## Options

Every request takes an optional `options` object as its last argument. The following options are allowed:

- `ttl` - time in seconds to cache the response in redis. If not set, cache will not be used. Value can also be a human-friendly string like `5 minutes` or `4 hours`.
- `bearer` - a string of the current username. Can be used if `hapiRequest` is not available. If both `hapiRequest` and `bearer` options are specified, `bearer` takes precedence.
- `logger` - an object with four methods: `debug`, `info`, `warn`, and `error`. See the [bole API](https://github.com/rvagg/bole#api) for more info.
- `hapiRequest` - a Hapi request object. If the request is from a logged-in user, this will set `bearer` automatically. The client will also emit log messages using the given request's `logger`.

## Auth

All `PUT`, `POST`, and `DELETE` operations require a bearer token. Some `GET` requests do too.

To inject a bearer token into the request, pass a [hapi request object](http://hapijs.com/api#request-object) as the last argument, or an object with a `bearer` string:

```js
npm.collaborators.get('@npm/foo', {hapiRequest: request})
// or
npm.collaborators.get('@npm/foo', {bearer: 'zeke'})
```

## Caching

To enable the built-in redis cache, set `ACL_CLIENT_REDIS_URL` in the environment before
requiring the client. To cache a request, specify a TTL in seconds or a human-friendly
string like `5 hours` or `20 minutes`.

```js
// set this _before_ requiring the module
process.env.ACL_CLIENT_REDIS_URL = 'redis://localhost:6379'

// initialize the client. The redis instance will be attached to each method
var npm = require('npm-api-client')()

// set a `ttl` option in seconds
npm.packages.get('browserify', {ttl: 60})

// or use a human-friendly string
npm.packages.get('browserify', {ttl: '2 hours'})
```

To invalidate the cache for a specific request, call that request's `cache.drop` method,
passing the same arguments used when making the initial request:

```js
npm.packages.get.cache.drop('browserify')
  .then(function(){
    // bye-bye browserify
  })
```

Note: the optional `options` object used to initially make the request, e.g.
`{ttl: 60, logger: null}`, need not be present when calling `cache.drop()`

## Environment Variables

- `ACL_CLIENT_HOST` (required): the hostname (and optional port) to make requests to, sans `http(s)` scheme.
- `ACL_CLIENT_CUSTOMER_HOST` (optional): the hostname for `npm.customer` requests
- `ACL_CLIENT_REDIS_URL` (optional): a redis instance for caching request responses

## API

See [dist/operations.json](dist/operations.json) for more details about the methods below.

#### `packages.get(packageName, [query], [options])`

- Get metadata for a specific npm package
- GET /package/{packageName}

#### `packages.list([query], [options])`

- Get collections of packages, sorted various ways
- GET /package

#### `packages.count([query], [options])`

- Get a count of all the public packages in the registry
- GET /package/-/count

#### `packages.star(packageName, body, [options])`

- Star a package
- PUT /package/{packageName}/star

#### `packages.perms(packageName, [query], [options])`

- Get an aggregate permissions object for a package. This endpoint is used internally by the cache.
- GET /package/{packageName}/perms

#### `packages.delete(packageName, [options])`

- Delete a package. Meant for admin purposes, such as unpublish.
- DELETE /package/{packageName}

#### `packages.create(body, [options])`

- create a new package (infers whether org or user based on scope).
- PUT /package

#### `packages.getDefaultTeam(packageName, [query], [options])`

- Get the default team for the package. Bearer user must be super-admin, team-admin of the default team or owner of the package
- GET /package/{packageName}/default-team

#### `collaborators.list(packageName, [query], [options])`

- Get all collaborators on a package
- GET /package/{packageName}/collaborators

#### `collaborators.add(packageName, body, [options])`

- Add a new collaborator to a package
- PUT /package/{packageName}/collaborators

#### `collaborators.update(packageName, userName, body, [options])`

- Update a collaborator
- POST /package/{packageName}/collaborators/{userName}

#### `collaborators.delete(packageName, userName, [options])`

- Remove a collaborator from package
- DELETE /package/{packageName}/collaborators/{userName}

#### `users.create(body, [options])`

- Create a new npm user account
- PUT /user

#### `users.update(userName, body, [options])`

- Update an npm user account
- POST /user/{userName}

#### `users.get(userName, [query], [options])`

- Get metdata for a specific user
- GET /user/{userName}

#### `users.delete(userName, [options])`

- Delete a user
- DELETE /user/{userName}

#### `users.login(userName, body, [options])`

- Authenticate a user with username and password.
- POST /user/{userName}/login

#### `users.verify(userName, body, [options])`

- Verify a user&#x27;s email address
- POST /user/{userName}/verify

#### `users.getPackages(userName, [query], [options])`

- Get all packages collaborated on by a specific user. A bearer token is provided indicating the user requesting the listing. Returns all packages that user has write access to, and that the user associated with the bearer token has read or write access to.
- GET /user/{userName}/package

#### `users.getStars(userName, [query], [options])`

- Get a list of packages starred by the given user.
- GET /user/{userName}/stars

#### `users.createPackage(userName, body, [options])`

- Create a placeholder package
- PUT /user/{userName}/package

#### `users.setLicense(userName, body, [options])`

- Associate a license with a user. internal API endpoint, no bearer token required.
- POST /user/{userName}/license

#### `users.getLicense(userName, body, [options])`

- Fetch the license associated with a user.
- POST /user/{userName}/license

#### `users.search([query], [options])`

- Perform typeahead search based on email or name.
- GET /user/-/search

#### `teams.update(teamName, body, [options])`

- Update a team&#x27;s meta-information. Bearer token must be provided, and bearer user must be team-admin or super-admin
- POST /team/{teamName}

#### `teams.delete(teamName, [options])`

- Delete a team.
- DELETE /team/{teamName}

#### `teams.addPackage(teamName, body, [options])`

- Add a package to a team. Bearer token must be provided, and bearer user must be team-admin or super-admin.
- POST /team/{teamName}/package

#### `teams.removePackage(teamName, [options])`

- Remove a package from the team. Bearer token must be provided, and bearer user must be team-admin or super-admin
- DELETE /team/{teamName}/package

#### `teams.addUser(teamName, body, [options])`

- Add a user to the team. Bearer user must be team-admin or super-admin
- POST /team/{teamName}/user

#### `teams.removeUser(teamName, [options])`

- Remove a user from the team. Bearer user must be team-admin or super-admin
- DELETE /team/{teamName}/user

#### `orgs.create(body, [options])`

- Create an organization.
- PUT /org

#### `orgs.get(orgName, [query], [options])`

- Get an organization&#x27;s meta information.
- GET /org/{orgName}

#### `orgs.delete(orgName, [options])`

- Delete an organization. Bearer token must be provided, and bearer user must be a super-admin of org.
- DEL /org/{orgName}

#### `orgs.update(orgName, body, [options])`

- update the organization&#x27;s meta information. bearer token must be provided. bearer must be a super-admin of the org.
- POST /org/{orgName}

#### `orgs.addUser(orgName, body, [options])`

- Add a user to the organization. Bearer token must be provided. Bearer must be a super-admin of the org
- PUT /org/{orgName}/user

#### `orgs.users.list(orgName, [query], [options])`

- Get users within organization. TODO: we should allow users to announce whether or not they are within the org. Currently we default to this information being public.
- GET /org/{orgName}/user

#### `orgs.users.delete(orgName, [options])`

- Delete user from organization. Bearer token must be provided, and bearer must be super-admin of organization.
- DEL /org/{orgName}/user

#### `orgs.users.update(orgName, userName, body, [options])`

- Update a user&#x27;s role within the organization. Bearer token must be provided. Bearer must be super-admin of organization
- POST /org/{orgName}/user/{userName}

#### `orgs.packages.list(orgName, [query], [options])`

- Get all packages within organization. Bearer token must be provided. If bearer is not part of org, public packages for org are returned. If bearer is developer, or team-admin, packages for teams that they are on are returned. If the bearer is a super-admin of the org, all packages for the org are returned.
- GET /org/{orgName}/package

#### `orgs.packages.create(orgName, body, [options])`

- Create a package. Bearer token must be provided, and bearer must be member of organization.
- PUT /org/{orgName}/package

#### `orgs.teams.list(orgName, [query], [options])`

- Get all teams within the organization. Bearer token must be provided. Bearer must be member of organization. If bearer is developer a list of all the teams that they are part of is returned. If bearer is team-admin or super-admin, a list of all teams is returned.
- GET /org/{orgName}/team

#### `orgs.teams.create(orgName, body, [options])`

- Create a team. Bearer token must be provided, and bearer must be super-admin or team-admin.
- PUT /org/{orgName}/team

#### `orgs.listScopes(orgName, [query], [options])`

- List an organization&#x27;s scopes. Bearer token must be provided. Bearer must be a member of the organization.
- GET /org/{orgName}/scope

#### `orgs.setLicense(orgName, body, [options])`

- Associate a license with an org by id. Internal API endpoint, no bearer token required.
- POST /org/{orgName}/license

#### `customers.get(userName, [query], [options])`

- Fetch a customer record by npm username.
- GET /stripe/{userName}

#### `customers.create(body, [options])`

- Create a new customer.
- PUT /stripe

#### `customers.update(userName, body, [options])`

- Create a new customer.
- POST /stripe/{userName}

#### `customers.delete(userName, [options])`

- Delete a customer by npm username.
- DELETE /stripe/{userName}



## How it Works

[src/operations.yml](src/operations.yml) defines a list of http operations. An operation looks like this:

```yml
name: packages.get
description: Get metadata for a specific npm package
path: /package/{name}
method: GET
```

When you `require('acl-client')()`, the [index](src/index.js) iterates over each
operation in the schema and binds a [reusable request function](src/operate.js) to each. The end result
is a tree of functions, namespaced by their dot-delimited `name` property from the schema:

```
packages: {
  get: [Function],
  list: [Function],
  count: [Function],
  star: [Function],
  perms: [Function],
  delete: [Function],
  create: [Function],
  getDefaultTeam: [Function]
},
collaborators: {
  list: [Function],
  add: [Function],
  update: [Function],
  delete: [Function]
},
...
```
