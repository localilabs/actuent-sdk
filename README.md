# @actuent/sdk

List your site on [Actuent](https://actuent.ai) — The Internet for AI.

AI agents can't read normal websites. Actuent fixes that with LAWP (Locali AI Web Protocol) — a structured JSON version of your site that any AI can read, understand, and act on.

## Install

```bash
npm install @actuent/sdk
```

## Usage

```typescript
import { register } from "@actuent/sdk"

await register({
  apiKey: "your-actuent-api-key",
  site: {
    domain: "yoursite.com",
    name: "Your Site",
    pages: {
      "/": {
        title: "Your Site — Tagline here",
        content: "What your site does in plain English."
      },
      "/pricing": {
        title: "Pricing",
        content: "Plan A: £10/month. Plan B: £25/month."
      }
    },
    actions: [
      {
        id: "signup",
        name: "Sign up",
        description: "Create a new account",
        intent: ["sign up", "register", "create account", "join"],
        input: { type: "text", required: false }
      }
    ]
  }
})
```

## Get an API key

Visit [actuent.ai](https://actuent.ai) to get your API key.

## What is LAWP?

LAWP (Locali AI Web Protocol) is a structured JSON format for websites — like HTML but built for AI agents instead of browsers. When you register your site with Actuent, AI agents can find it, read it, and take actions on it just like a human would browse your site.

## Verify your domain

Registering requires proof that you own the domain. If it isn't verified yet, `register()` fails with a token. Add it as a DNS TXT record and run `register()` again:

```
yoursite.com  TXT  "actuent-site-verification=<token>"
```

Serving a valid `https://yoursite.com/.well-known/lawp.json` verifies you automatically.

## Executable actions

Give an action an `endpoint` in your own `/.well-known/lawp.json` and AI agents can perform it through Actuent. Requests are signed with Ed25519. See https://docs.actuent.ai/#actions
