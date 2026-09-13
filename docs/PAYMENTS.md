# Payments (DOKU)

The shop takes payment through [DOKU](https://www.doku.com) Checkout — DOKU's
hosted payment page, which covers virtual accounts, QRIS, e-money, cards and the
rest without any card details ever touching this site.

After payment, the buyer is emailed a private, signed download link for each
file they bought.

**The code is finished. It needs credentials to do anything.** Until
`DOKU_CLIENT_ID` and `DOKU_SECRET_KEY` are set, the basket totals up correctly
and then says payment is not connected, rather than showing a button that goes
nowhere.

It leans on three services:

| Service | For | Provisioned |
|---|---|---|
| DOKU | Taking payment | Manually — not on the Vercel Marketplace |
| Upstash Redis | Remembering what each order contained | `vercel integration add upstash/upstash-kv` |
| Resend | Sending the receipt | `vercel integration add resend/resend-email` |

## What happens when someone buys

1. They fill the basket and enter their email on `/keranjang`.
2. The browser posts **slugs and quantities only** to `/api/doku/checkout`.
3. That route looks every price up from `content/produk/` **on the server**,
   totals the order, writes it to Redis as `PENDING`, and asks DOKU for a
   payment page.
4. They pay on DOKU's page, then come back to `/toko/selesai`.
5. DOKU posts a signed notification to `/api/doku/notification`. That route
   verifies the signature, marks the order paid **once**, signs a download link
   per product, and emails them.
6. The buyer clicks a link, `/unduh/<token>` checks the signature, and the file
   is streamed.

Nothing in step 5 or 6 needs you.

## Setting it up

### 1. Get your keys

From the [DOKU Back Office](https://dashboard.doku.com): **Client ID** and
**Secret Key**. There is a separate pair for sandbox and for production; they are
not interchangeable.

### 2. Put them in the environment

Locally, copy `.env.example` to `.env.local` and fill it in. `.env.local` is
gitignored — **never commit it, and never paste a secret key into a chat, an
issue, or a commit message.**

On Vercel, set them as environment variables rather than in a file:

```bash
vercel env add DOKU_CLIENT_ID production
vercel env add DOKU_SECRET_KEY production
vercel env add DOKU_ENV production        # value: production
```

Do the same for `preview` if you want preview deployments to reach the sandbox.

**None of these may ever carry a `NEXT_PUBLIC_` prefix.** A `NEXT_PUBLIC_`
variable is inlined into the browser bundle. The secret key there would let
anyone forge a payment notification and mark their own order paid.

### 3. Register the notification URL

In the DOKU Back Office, set the **Notification URL** to:

```
https://dsapoetra.com/api/doku/notification
```

This has to match exactly. The path is part of the string DOKU signs, so a
trailing slash or a different path makes every notification fail verification —
with no other symptom than 401s in the log.

### 4. A download secret

```bash
openssl rand -base64 32
```

Set it as `DOWNLOAD_SECRET`. Its own value, not the DOKU key — see
[Download links](#download-links).

### 5. Verify a sending domain in Resend

Resend will only deliver from a domain you have verified, which means adding DNS
records for `dsapoetra.com` in the Resend dashboard. Until that is done,
`SHOP_FROM_EMAIL` is accepted by the API and the mail quietly does not arrive —
watch for `fulfilment.email_failed` in the logs.

### 6. Test in the sandbox first

Leave `DOKU_ENV=sandbox` and buy something with DOKU's test payment details.
Check that:

- the payment page opens,
- you land back on `/toko/selesai`,
- the log shows `doku.notification` with `status: SUCCESS` and the right amount,
- then `fulfilment.sent`,
- the receipt actually arrives, and its download link serves the file.

Only then switch `DOKU_ENV` to `production` with the production keys.

## Why there is a database

DOKU's notification carries an invoice number, an amount and a status — not what
was bought, and not who bought it. Their Check Status API returns the same
shape. So there is nowhere to get "email these two files to this person" from
unless the order was written down when checkout started.

That is all Redis is doing here: `order:<invoice>` → the order, with an expiry.
No queries, no joins, no reporting — the DOKU Back Office remains the ledger.
Orders are kept **180 days**, comfortably longer than the 30-day download links
so a buyer whose link expired still has an order to re-issue from, and not
forever, because this holds an email address.

### Sending exactly once

DOKU retries notifications. The receipt must go once.

`markPaid` claims the order with a single atomic `SET NX` on a `paid:<invoice>`
key. Whichever call wins gets `firstTime: true`; every other call — a retry, or
two notifications racing — gets `false` and sends nothing. The Resend request
also carries an `Idempotency-Key` of the invoice number, as a second net.

### Product files

Files live in `private/produk/`, outside `public/`, so nothing in there is
reachable by URL. A product points at one with `download:` in its `.mdx`:

```yaml
download: sunyi-hanya-angan.pdf
```

The frontmatter schema restricts that to a bare filename — no slashes, no `..` —
and the read path re-checks it before touching the disk. `next.config.ts` names
the folder in `outputFileTracingIncludes`, because the files are read by path at
runtime and tracing would otherwise leave them out of the deployment.

**A product with no `download:`, or one naming a file that is not deployed,
still sells.** It appears in the receipt under "menyusul" and you send it
yourself. That check happens when the link is signed, not when it is clicked, so
a buyer is never handed a link that fails.

### Download links

`/unduh/<token>`. The token carries the claim — this invoice, this product, this
expiry — plus an HMAC over it. **The signature is the authorization**: no
session, no cookie, which is what lets the link work from an email client on any
device. It is therefore a bearer credential: forwarding the email forwards the
product. Scoped to one product and expiring in 30 days is the right trade at
this size; anything stricter needs accounts.

Signed with `DOWNLOAD_SECRET`, deliberately **not** the DOKU key — rotating the
DOKU key would otherwise silently break every link already sitting in an inbox.

## The two rules this design rests on

**1. The browser never says what anything costs.** It sends slugs and
quantities. Prices come from `content/produk/` on the server. There is no field
in the checkout request that could influence the amount charged — a request that
tries to include one is ignored.

**2. Nothing is trusted until the signature checks out.** The notification body
is read as raw bytes, verified against DOKU's HMAC-SHA256 signature, and only
then parsed. `/toko/selesai` is *not* proof of payment — anyone can open it with
any order number in the URL, which is why it says the order was received rather
than that it was paid.

## Reading the logs

Both routes log one structured JSON line per event, visible in
`vercel logs` or the Vercel dashboard:

| Event | Meaning |
|---|---|
| `doku.checkout.created` | A payment page was opened. Has the invoice number, amount and items |
| `doku.checkout.failed` | DOKU refused the request. The `body` field has their reason |
| `doku.notification` | A verified notification. `status: SUCCESS` means paid |
| `doku.notification.rejected` | Signature did not verify — either misconfiguration or someone probing |
| `fulfilment.sent` | The receipt went out. Has the Resend message id |
| `fulfilment.already_sent` | A retry that correctly sent nothing |
| `fulfilment.email_failed` | **Money taken, no email.** Needs you to send it by hand |
| `fulfilment.file_missing` | A `download:` names a file that is not deployed |
| `fulfilment.unknown_order` | Signed by DOKU, but for an invoice this deployment never wrote — usually sandbox notifications hitting production |
| `download.served` | Somebody downloaded their file |

A burst of `doku.notification.rejected` right after go-live almost always means
the Notification URL in the Back Office does not match `/api/doku/notification`,
or the keys are from the other environment.

## When something is wrong

| Symptom | Almost always |
|---|---|
| `Invalid Client-Id` in `doku.checkout.failed` | Wrong key pair, or sandbox keys with `DOKU_ENV=production` |
| `Invalid Signature` from DOKU | System clock badly out of sync — the timestamp is signed |
| Every notification 401s | Notification URL does not match the signed path |
| Basket says payment is not connected | `DOKU_CLIENT_ID` or `DOKU_SECRET_KEY` is not set in that environment |
| Paid, but no email arrived | Check `fulfilment.email_failed`. Usually `SHOP_FROM_EMAIL` is on a domain not verified in Resend |
| Receipt says "menyusul" for everything | No product has a `download:`, or the files are not deployed |
| Download link 503s | The file is missing from `private/produk/` in the deployment |

## Where the code is

| File | Does |
|---|---|
| `lib/doku/signature.ts` | HMAC signing and notification verification |
| `lib/doku/client.ts` | The Checkout API call |
| `lib/doku/config.ts` | Credentials and endpoints. `server-only` |
| `lib/doku/invoice.ts` | Order reference generation |
| `lib/orders/store.ts` | Orders in Redis, and the send-once claim |
| `lib/download/token.ts` | Signing and verifying download links |
| `lib/download/files.ts` | Reading files out of `private/produk/` |
| `lib/email/receipt.ts` | The receipt's wording and markup |
| `lib/email/send.ts` | The Resend call |
| `app/unduh/[token]/route.ts` | Serves a file against a valid signature |
| `app/api/doku/checkout/route.ts` | Creates a payment page from the basket |
| `app/api/doku/notification/route.ts` | Receives and verifies DOKU's callback |
| `app/toko/selesai/` | Where the buyer lands afterwards |

Implemented against DOKU's published spec (`developers.doku.com`), with the
request shape confirmed against their sandbox endpoint.
