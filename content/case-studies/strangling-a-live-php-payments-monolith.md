---
title: Strangling a live PHP payments monolith
date: "2026-08-30"
summary: Moving checkout to Spring Boot one capability at a time while the old system kept taking money.
readingTime: 12
context:
  System: "PHP 7.4 payments monolith, 9 years old, 340k lines. Target: Java 21 / Spring Boot 3 services."
  Scale: Six gateways, all OLX Indonesia paid listings and ad packages, peak traffic on the first days of each month.
  My role: Engineering Manager. Sequencing, routing design, gateway adapter reviews, the cutover checklist.
reflection: |
  Start the reconciliation job before writing any new code. We built it in
  month three and it changed the order of everything after it. And I would have
  written the competency framework earlier: half the migration was teaching PHP
  engineers to be confident in Java, and that deserved a plan of its own.
---

## Starting point

The monolith worked. That was the problem: nobody wanted to be the person who
broke checkout on the first of the month. Deployments took forty minutes and
happened twice a week, and every gateway integration lived in the same
4,000-line class. We could not hire for it, and the two people who understood
it were both on my team.

A rewrite was off the table. Revenue could not pause and the business would not
accept a six-month feature freeze. So the constraint became the design: replace
the system while it keeps taking money.

## Routing by capability

We put a thin proxy in front of the monolith and moved one capability at a
time: invoicing first because it was read-heavy and low-risk, then coupons,
then the gateway adapters, then order and checkout last. Each capability got a
flag that routed by request, not by user, so a single buyer could touch old and
new code in the same session without seeing a difference.

<Diagram caption="Proxy routing between the PHP monolith and the Spring Boot services" />

## Shadowing and reconciliation

Before any flag went to 100%, the new service ran in shadow for at least two
weeks: same request, both systems, diff the responses nightly. The
reconciliation job found 23 behaviour differences, 19 of them bugs in the old
system that we had to reproduce on purpose.

## Cutover

Checkout moved on a Tuesday at 03:00 WIB with a one-line rollback. Nothing
paged. Fourteen months in, 11 of 17 services are on Spring Boot and the
monolith serves two endpoints that will retire this quarter.
