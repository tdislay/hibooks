# Hibooks

<div align="center">
<img alt="Hibook mascot" src="./hibook.svg" width=126/>
<p>Hibooks is a books web app where you can search for books, give your opinions, receive recommendations, and stay up to date with your favorite authors' new releases.</p>
</div>

> [!IMPORTANT]
> Hibook is just a showcase project. Nothing else.
>
> It's under 🚧 active development 🚧, features will be implemented soon!

**Technical Stack**

- Nest / Typescript
- Postgresql
- Redis
- React / Next
- Docker

## Development

To install and run:

```bash
git clone git@github.com:tdislay/hibooks.git
cd hibooks
npm install
cp ./backend/.env.example ./backend/.env
cp ./frontend/.env.example ./frontend/.env.local
npx -w backend prisma generate
npx -w backend prisma db push
npx -w backend prisma db seed
npm run dev
```

## Features

- [ ] Authentication
  - [x] **Homemade Local Authentication**
  - [x] Sign up user
  - [x] Email verification using one time password
  - [x] Sign up & login from frontend
  - [ ] Check username uniqueness with debounce
  - [ ] Form Validation
  - [ ] Google **SSO**
- [ ] CRUD Books
- [ ] Preferences (follow series and authors)
- [ ] **Real time Notifications (SSE)**
- [ ] CRUD Users
  - [ ] Upload profile picture on AWS S3
  - [ ] GET User (retrieve only non sensitive information)
  - [ ] Backend password change
- [ ] CRUD BookOpinions (If account is verified)
- [ ] **Efficient Book Search**
  - [ ] Open Search (data replication)
  - [ ] Search endpoint
- [ ] **Realtime book recommendation using Graph databses**
  - [ ] Neo4J (data replication)
  - [ ] Recommendation Algorithm

# Discussion

In this section, I will detail the technical choices I took. How they are coherent with the context, and what are their limitations.

## Nest

NestJs, as a highly opinionated framework which firmly follows SOLID principles, appears to be a great choice in an enterprise context. In fact, JavaScript permissiveness is a double-edged sword. While it brings freedom to developpers, on the other side it can lead to spaghetti-code and unmaintainable projects. That's why using opinonated frameworks allow developpers to avoid common pitfalls by restricting the choices they can take, which helps greatly to write consistent and organized code within a team.
Also, NestJs enforces a modular monolith architecture, thus strongly helping migration towards microservices if needed later.
Modular monoliths also encourages code cohesion by organizing by domain / feature and not by technical aspects.

However, I consider Nest to be too restrictive and overuse Inversion Of Control. Which could result in seeing everything _as a nail_.
While IoC is a great pattern, considering JavaScript idioms, DI seems to better suit OOP-only context. Moreover, as my approach to tests is feature-centric, I don't find unit tests to be the best value (see [Tests](#tests)), thus, I was able to use DI at its best only once. The rest was OOP and DI boilerplate.

### Express over Fastify

I chose Express over Nest only because it's the default choice as they state the ecosystem is superior to fastify's and as time has proven express has a really stable solution.
However, I consider fastify a far better choice, its plugin system is really well made (you can avoid express's "next()" hell), supports natively async function.
Also `express.Router()` is made with regex matching, whereas koa / fastify are made with `find-my-way` (routing is done with a Radix tree, which is way more effecient, especially as the number of routes increases). Though, the backend framework is scarcely the bottleneck (network and databases are). All in all, it does not really matter.

### Configuration Module

The `@nestjs/config` is sufficient for our needs. But if the app grew in complexity (e.g. requiring multiple external API keys) or in developer staff, it would require a more advanced solution (like a in-cloud vault, or encrypted .env files) to avoid sharing, in clear, huge .env files between developers as secrets change.

## Environment

Dockerizing services and applications in development is a good practice as it allows us to use an environment identical to the one in production, independently of the developer's environment (OS, installed libraries or binaries).
Thus it mitigates some issues by catching them early on during development and testing.

## Authentication

### Rolling my own authentication system

A well-known adage is to `never roll your own authentication [implementation]`.

Effectively, security is binary: it is secure or it is not. There are many pitfalls you have to be aware in order to avoid all of them. Of course, in any enterprise context, authentication should be built upon proven (talking years even decades) stables and robusts libraries.

However, authentication is quite of an interesting field. Out of curiosity, and for educational purposes, I decided to fully implement my own for a better overall understanding.

Nonetheless, I took into consideration different points:

#### Bcrypt

Bcrypt is an industry hash standard. Salt is directly concatened to the hash. Thus, removing the possibility of using a rainbow table to retrieve the password from the hashes and ensures better security practices amongst developers. Also, you can make the hash function slower by adding more rounds, thus making the hashes less prone to brute-force attacks.

#### Storing sessions in cookies

Bearing in mind XSS attacks can't be fully eliminated, Web Storage is not a proper place to store sessions as it is accessible by using JavaScript.
Whereas, through the ages, many secure mechanism have been implemented to Cookies in order to mitigate attacks. The `HttpOnly` and `Secure` attributes make cookies protected against XSS and some MiTM attacks.
Though, cookies are still prone to CSRF. We used to implement a csrf-token, stored in web storage (not prone to CSRF attacks). But nowadays this can be mitigated by simply using `sameSite="lax"` (only GET Requests initiated from other sites will include cookies), which is available to [approximately 96%](https://caniuse.com/mdn-http_headers_set-cookie_samesite_lax) users through modern web browsers.
While GET Requests should never do anything, just return content, we can't be always sure it is the case. So, as another layer of protection, you can use `sameSite="strict"`. Therefore, cookies will never be included in request iniated from other sites. The only remaingin weakness, as a `site` is strictly different from an `origin`, is through untrusted content that can be hosted on your subdomains (e.g. pages.github.com).

#### Session length and entropy

As OWASP recommends, the session identifier length should be equal or greater than 128 bits and entropy should be equal or greater than 64 bits.
Also a cryptographically secure pseudorandom number generator (CSPNG) should be used ([`randomBytes` is one](https://nodejs.org/api/crypto.html#cryptorandombytessize-callback)).

#### Cookie signing

Signing cookies make them non fungible. HMAC-SHA256/HS256 is used under the hood, it's a symmetric signing scheme which will be enough for our usecase. As I don't have other parties which would validate my cookie, using asymetrical signing schemes like RS256 would introduce a bit more complexity for not not much. JWTs could have been used with RS256 (as cookie-parser only supports HS256).

Cookie signing really shines when you use token-based (stateless) authentication (see [Session-based (stateful) authentication](#session-based-stateful-authentication)), and when your token contains sensitive informations (role, permissions) as it ensures data integrity. However, it stills add a layer of security against collision attacks.

### Session-based (stateful) authentication

Currently, the popular trend is to choose stateless authentication (also missnamed "token-based authentication"), notably with JWTs.
Stateless authentication clearly has its place in the industry (as detailed bellow). Still, I believe it should not be replacing traditionnal statefull authentication (meaning, the server keeps / controls the state of the sessions, e.g. by storing the sessions in a database).

Stateless-based authentication has the benefits of self containing information and their validity (origin and expiry). Also, they are not tamperable. The benefits may seem to be:

1. No access to a database is required (meaning faster responses)
2. Easier to scale in microservices (using RSA, public keys for checking signature validity can be given to some services, while only one service can emit the tokens using the private key)
3. Easier to implements (do not require to store sessions in the backend)

But those points can be misleading depending on what you're trying to achieve.
Stateless means the server has no control over the session and its validity. With token-based, out of the box, only the TTL can be used to invalidate the token (purposely ignoring the signature part as it validate **every** tokens emitted).

#### 1. No access to a database is required

The previous statement implies tokens revocation can't be done immediately (after determined events), but needs to be predetermined.

This is a major security concerns, it means that:

- Changing a password or logging out, will **not** revoke previous sessions.
- Logging out an unknown session (i.e. from an attacker) is not possible
- The token can contains stale data (e.g. when permissions are revoked).

  The popular workaround is to set a very low TTL and implement a mechanism that will check against a database the session validity (e.g. with a refresh token). Either way, this produces very complex code that is **reimplementing statefulness** to authentication. Which annihilates the initial goal of stateless authentitcation.

#### 2. Easier to scale with microservices

You're not Google (yet ?).

You should not drive your architecture choices out of anticipation for something that may not arrive (but will surely add complexity and can lead to security flaws !). Thoses architectures are not magical: solving the problems they target, comes with a tradeoff: _complexity_.

#### 3. Easier to implements

[As seen above](#1-no-access-to-a-database-is-required), security-wise, they are not.

Also, you're limited by the length of your tokens (as cookies have a length limit and you need to put your whole session in the token in order to achieve stateless), though you could divide your tokens in partionned cookies, resulting in increased requests size (and some more complexity).

#### Where stateless authentication really shines

However, as said in the beginning, stateless has usecases where it can still shine. This [blogpost](http://cryto.net/%7Ejoepie91/blog/2016/06/13/stop-using-jwt-for-sessions/) sums it up as when the tokens are **short-lived**, **have only one use** or **the application still uses stateful authentication**. Here are examples:

- Microservices, as a one time password between your services ([but you might not need microservices](#2-easier-to-scale-with-microservices)).
- OTP, e.g. "verify account", "change your password" or downloads actions.
- Where session security does not matter, but performance does: online video games with any important data.
- SSO: as long as the user authentication is still based on statefull sessions (thus can be revoked), giving tokens to other servers is safe (backend/server can be trusted, wheras frontend/client can't be, [by definition](https://blog.kuzzle.io/why-you-cant-secure-a-frontend-application)).

As stated in a [redis blogpost](https://redis.io/blog/json-web-tokens-jwt-are-dangerous-for-user-sessions/), the less complex and fatest way (if performance is a concern) of handling session-based authentication is just to use an in-memory database for session (e.g. Redis) instead of traditional databases (e.g. Postgres).

> N.B. the blogpost, by its origin, as a large bias towards session-based authentication.

Considering it would not add more complexity compared to simply using Postgres: I decided to use Redis as my session datastore (though, I decoupled it from my authentication module, thus making it change-proof).

### Email verification

When I first wrote the email verification service, I did not required the user to be authenticated. So I naturally made the OTP non fungible.

After some thought, I added the authentication guard on the "verify account" route, thereby making non fungibility useless (as session token already are).
Also, for a better user experience it would have been nicer to use small alphanumeric writable codes (e.g. "B4D86M"). Thus, a user could use its smartphone to view the email, and manually enter the code on its computer.

I left my code as so because I find the HS256 signing / validating process interesting.

AWS SES and nodemailer are used to send the emails from a custom domain name (_hibooks.xyz_). It is behind an abstraction because it is a part of the code that can quickly mutate.

## ORM

### Prisma

ORMs provide many benefits: Developer Experience, speed of development, [data abastraction](#repository-pattern). I chose Prisma for the type safety it provides. Being aware of the performance issue ORMs can lead to (in-memory joins) I opted to use [the `relationJoins` preview features](https://blog.kuzzle.io/why-you-cant-secure-a-frontend-application). However, I'm aware of the ORMs limitations:

1. Unnecessary complicated code when trying to achieve complex queries (due to the level of abstraction)
2. Ineffective and numerous queries for simple things
3. Tightly coupled to the library, to its mainteners and to their choices

Nevertheless, raw sql queries in Prisma and prepared statements can be used to mitigate `1.` and `2.` (of course, they should be encapsulated in a layer of abstraction). As for the third point, there is no evolution planned for this project.

### Repository pattern

Considering ORMs are already an abstraction over data persistence (except for raw sql queries), I don't see a need for the repository pattern. The only benefits would be to be able to switch from one ORM to the other (or no ORM). But I find it to be much overhead for so little gain for this project.

## Tests

My approach to tests is feature-oriented. Instead of the pyramid of test, I refer to the test diamond.

I strongly believe that, while developing a web application, the most important thing is to catch **features**-oriented bugs early. To do so, I find functional tests to have the best value/cost ratio, especially as we don't stub anything and test directly against a production-like infrastructure whenever as possible (sometimes it's not or more convenient: mocking a smtp server to receive emails, mocking an external API).

However, unit tests still have their importance. Mainly on critical **algorithm**-oriented functions (e.g. a freight charges calculator). While E2E are great for critical **user flows** (e.g. e-commerce cart and payment flow).

> N.B. For convenience, I kept the Nest "E2E" wording. In this context, they are more related to functional tests. True E2E tests should be done against a frontend app / from a user perspective.
