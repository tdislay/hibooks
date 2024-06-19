# Hibooks

<div align="center">
<img alt="Hibook mascot" src="./hibook.svg" width=126/>
<p>Hibook is a book web app where you can search for books, give your opinions, receive recommendations and stay up to date with your favorite authors' new releases.</p>
</div>

> [!IMPORTANT]
> Hibook is just a showcase project. Nothing else.
>
> It's under 🚧 active development 🚧, features will be implemented soon !

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
npx -w backend prisma generate
npx -w backend prisma push
npx -w backend prisma db seed
npm run dev
```

## Features

- [ ] Authentication
  - [x] Local Authentication
  - [ ] Google SSO
- [ ] Users
  - [ ] Create user
  - [ ] Email verification using jwt
- [ ] CRUD Books
- [ ] **Real time Notifications (SSE)**
- [ ] CRUD BookOpinions
- [ ] **Efficient Book Search**
  - [ ] Elastic Search (data replication)
  - [ ] Search endpoint
- [ ] **Realtime book recommendation using Graph databses**
  - [ ] Neo4J (data replication)
  - [ ] Recommendation Algorithm

# Discussion

In this section, I will detail the choices I made, how they are coherent to the context, and what are their limitations.

## Nest

I decided to use NestJs because it's highly opinionated and follows SOLID principles, which is a must-have in an entreprise context. As javascript is being too permisive, using opionated framework allows to avoid common pitfalls and so helps developers to write consistent and organized code.
NestJs is especially enforcing a modular monolith architecture (which would help migration towards microservices), which I appreciate, as I strongly believe code should be organized by domain / feature (cohesion) and not by technical aspects.
Though I consider Nest to be overabusing of Inversion Of Control and being too little permissive.
I find dependency injection to not very well fit the JS idiomatics, and that DI is better in POO-only context. Moreover, as my approach to tests is feature-centric, I don't find unit tests to be the best value (see [Tests](#tests)), thus, I couldn't use DI at its best.

### Express over Fastify

I chose Express over Nest only because it's the default choice as they state the ecosystem is superior to fastify's and as time has proven express has a really stable solution.
However, I consider fastify a far better choice, its plugin system is really well made (you can avoid express's "next()" hell), supports natively async function.
Also `express.Router()` is made with regex matching, whereas koa / fastify are made with `find-my-way` (routing is done with a Radix tree, which is way more effecient, especially as the number of routes increases). Though, the backend framework is scarcely the bottleneck (network and databases are). All in all, it does not really matter.

### Configuration Module

The `@nestjs/config` is sufficient for our needs. But if the app grew in complexity (e.g. requiring multiple external API keys) or in developer staff, it would require a more advanced solution (like a in-cloud vault, or encrypted .env files) to avoid sharing, in clear, huge .env files between developers as secrets change.

## Environment

I dockerized my services and my applications for development in the same environment as they would be in production. It's considered a good practice as environment issues (e.g. glibc version) will be catched during development / testing.

## Authentication

### Rolling my own authentication system

A well-known adage is to `never roll your own authentication [implementation]`.

Effectively, security is binary, it is secure or it is not. The pitfalls you have to take into account are tremendous. In any entreprise context, authentication should be built upon proven (talking years even decades) stable and robust libraries.

However, authentication is quite of an interesting field. Out of curiosity, and for educational purposes, I decided to fully implement my own for a better understanding.

Nonetheless, those are the different points I took into consideration:

- Using bcrypt, the industry hash standard. Salt is directly concatened to the hash. Thus, removing the possibility of using a rainbow table to retrieve the password from the hashes and ensures better security practices amongst developers. Also, you can make the hash function slower by adding more rounds, thus making the hashes less prone to brute-force attacks.
- Never returned a single password, even if it's hashed and salted
- Storing session as cookies. Web storage is prone to XSS attacks - which you can't eliminate 100% sure -, whereas cookies are only prone to CSRF which can be mitigated (only on modern browser; approximately 96%) by simply using sameSite="lax". For maximum prevention, you can use sameSite="strict" (GET requests initiated from other site won't include cookies, while "lax" will, so you must be sure your GET requests are safe) and ensures that untrusted content can't be hosted on your subdomains (e.g. pages.github.com).
- Signing the cookie to make it non fungible. HMAC-SHA256/HS256 is used under the hood, though it's a symmetric signing scheme. Not optimal as you can't have third-parties veriyfing your token's signatures AND you can't rotate signing keys without redeploying which will also invalidate previous sessions. JWTs could have been used with RS256 (as cookie-parser only supports HS256).
- Following OWASP recommendation for sesison ID length (>= 128 bits) and entropy (>= 64 bits)

### Session-based (stateful) authentication

Currently, the popular trend is to choose stateless authentication (e.g. token-based like JWTs).
It clearly has its place in the industry (as detailed bellow). Still, I believe it should not be replacing traditionnal statefull (e.g. in database session-based) authentication.

Stateless-based authentication has the benefits of self containing information and their validity (origin and expiry). Also, they are not tamperable. The benefits may seem to be, in the session context:

1. No access to a database is required (faster)
2. Easier to scale (using rsa, public keys for checking signature validity can be given, while only one service emits the tokens)
3. Easier to implements

But those points can be misleading depending on what you're trying to achieve (especially user authentication):

1. Being stateless means the server has no control over the session and its validity (actually, it's the very definition of _stateless_: the state does not exists anywhere). Only the TTL of the token can be used to ensure session validity (purposely ignoring the signature part as it only concerns token's origin).

Implying, they can't be revoked (on password changed, logout or even worse: logging out an unknown session from an attacker) and they can contain stale data (e.g., when permissions are revoked), this is a major security concerns. The popular workaround is to implement a mechanism that will check against a database, and thus reimplementing statefulness (and high complexity) to your authentication.

2. You're not Google (yet ?). You should not drive your architecture choice out of anticipation for something that may not arrive (but will surely add complexity and can lead to security flaws !).

3. They are not (see 1.). Also, you're limited by the length of your tokens (as cookies have a length limit), though you could divide your tokens in partionned cookies, resulting in increased requests size.

However, as said in the beginning, stateless has usecases where it can still shines. This [blog post](http://cryto.net/%7Ejoepie91/blog/2016/06/13/stop-using-jwt-for-sessions/) sums it up as when the tokens are **short-lived**, **have only one use** or **the application still uses session**. Here are examples:

- Microservices, as a one time password, between your services (but you might not need microservices: 2. You're not Google (yet ?)).
- OTP, e.g. "verify account" or "change your password" emails, downloads.
- Where session security does not matter, but performance does: online video games with any important data.
- SSO: as long as the user authentication is still based on statefull sessions (thus can be revoked), giving tokens to other servers is safe (backend/server can be trustable, wheras frontend/client can't be - by definition).

As stated in a [redis blogpost](https://redis.io/blog/json-web-tokens-jwt-are-dangerous-for-user-sessions/), the less complex and fatest way (if performance is a concern) of handling authentication is just to use an in-memory database for session (e.g. Redis) instead of traditional databases (e.g. Postgres).

Considering it would not add more complexity compared to simply using Postgres: I decided to use Redis as my session datastore (in a decoupled way, as so, anything can be used as a datastore: memory, postgres, and so on.).

## Prisma and Repository pattern

Currently using an ORM, especially prisma for the type safety it provides and for simplicity sake. Being aware of the performance issue ORMs can lead to (in-memory joins) I opted to use the _relationJoins_ preview features. However, I'm aware of the other ORMs limitations (especially the abstraction provided can lead to unnecessary complicated code when trying to achieve complex queries), thus raw sql queries in Prisma and prepared statements can be used in those cases (of course, they should be encapsulated in a layer of abstraction).

Considering ORMs are already an abstraction over data persistence (except for raw sql queries), I don't see a need for the repository pattern. The only benefits would be to be able to switch from one ORM to the other (or no ORM). But I find it to be much overhead for so little gain for this project.

## Tests

My approach to tests is feature-oriented.

I strongly believe that, while developing a web application, the most important thing is to catch **features**-oriented bugs early. To do so, I find integration tests to have the best value/cost ratio, especially as we don't stub anything and test directly against a production-like infrastructure.

However, unit tests still have their importance. Mainly on critical **algorithm**-oriented functions (e.g. a freight charges calculator). While E2E are great for critical **user flows** (e.g. e-commerce payment).
