# Design

The record of what the design boards specified. `app/globals.css` implements
this; when the two disagree, this file is what the boards said.

Source: Claude Design project `dsapoetra portfolio boards`
(`935bb87a-da4f-4765-ad36-06bae6eae375`), boards 1a to 1l plus their dark-mode
mirrors. Background option 2c, "Graph paper".

## The idea

Two wings, one grid.

**Work** is sans. It sits in boxes and rows: cards, hairline-divided lists,
a fixed label column. It is scanned more than it is read.

**Writing** is serif. It sits in a single narrow column with air around it.
It is read.

The graph paper runs under both, and is what makes them one site rather than
two. The header and footer paint solid `--bg` over it so the grid stops at
their hairline and the bars read as the page's frame.

## Tokens

Light, on `:root`:

| Token | Value | Used for |
|---|---|---|
| `--bg` | `#FCFCFB` | page |
| `--fg` | `#22272E` | text |
| `--fg2` | `#5A636E` | secondary text |
| `--fg3` | `#8A8A84` | meta, dates |
| `--line` | `#E4E4E0` | hairlines |
| `--card` | `#FFFFFF` | cards |
| `--acc` | `#3D5A80` | links, active nav |
| `--sunk` | `#F7F7F5` | placeholders |
| `--grid` | `rgba(61,90,128,0.07)` | minor grid |
| `--grid2` | `rgba(61,90,128,0.16)` | major grid |
| `--line-hover` | `#B5B5AF` | card border on hover |

Dark, on `[data-theme="dark"]` and under `prefers-color-scheme: dark`:

| Token | Value |
|---|---|
| `--bg` | `#0E1B3A` |
| `--fg` | `#E8ECF4` |
| `--fg2` | `#A9B8D6` |
| `--fg3` | `#7F92B8` |
| `--line` | `#24365F` |
| `--card` | `#142449` |
| `--acc` | `#9BB8E8` |
| `--sunk` | `#142449` |
| `--grid` | `rgba(255,255,255,0.05)` |
| `--grid2` | `rgba(255,255,255,0.13)` |

Dark mode is declared **twice**, on purpose. The media query serves the reader
who has never touched a toggle. The attribute selector serves one who has, and
must win in both directions, which is why the media block is guarded with
`:not([data-theme="light"])`.

There is no toggle in the UI. The boards did not specify one; the CSS supports
`data-theme` so that adding one later is a component, not a restyle.

## Type

| Face | Variable | Where |
|---|---|---|
| Plus Jakarta Sans 400/500/600/700 | `--sans` | Work wing, nav, all meta |
| Newsreader 400/500/600 + italic | `--serif` | Writing wing |
| JetBrains Mono 400/500 | `--mono` | dates, tech tags, reading times |

Mono is for things read as **values**, not as language.

Work wing: body 15/1.45, h1 36/1.15 600 at `-0.02em`, h2 22/600, card h3 17/600,
case-study body 16/1.55.

Writing wing: landing 19/1.7, poem 22/1.8 with `white-space: pre-line`, story
20/1.7, titles 40 to 44 at weight 400. Meta drops back to sans 13px `--fg3`.

Home paragraph: sentence one in sans 24px, sentence two in serif 27px, on the
same line. The serif is set larger because Newsreader's x-height is smaller;
matching the point size makes it read as an afterthought rather than an equal
half.

Drop cap (stories, opt in via `dropcap: true`):

```css
::first-letter { float: left; font-size: 3.6em; line-height: .82;
                 padding: .08em .1em 0 0; font-weight: 500 }
```

## Layout

Nav 64px tall (56px under 720px), 1px bottom hairline, padding `0 40px`
(20px mobile). Name left at 600; Work / Writing / About / Now right at 14px.
The active item is `--acc` at weight 500, the rest `--fg2`.

Footer: 1px top hairline, 13px `--fg2`. Location left, links right. Under
720px the two swap order, so the links sit above the place name.

Measures, one per template:

| Template | Max width |
|---|---|
| Home | 880 |
| Work landing | 960 |
| Case study, note, About, Now | 720 |
| Writing landing | 680 |
| Poem | 640 |
| Story | 620 |

A story is narrower than a case study because prose wants about 65 characters
a line and technical writing tolerates more.

Cards: `--card` background, 1px `--line`, radius 8, padding 20 to 28. Hover
moves the border to `--line-hover`. **No shadows anywhere.**

Lists (experience, projects, notes): rows divided by 1px `--line`, no boxes.

Work section labels: 12px, 600, uppercase, `0.08em` tracking, `--fg2`, in a
fixed 200px column with a 32px gap. The column is fixed so all four sections
line up with each other.

Tech tags: mono 11px, 1px `--line`, radius 4, padding `1px 6px`, lowercase.

Everything collapses to one column under 720px. In the stacked experience and
note rows the date moves **above** the entry.

## Copy rules

- No em dashes.
- `2026-09-02` in mono lists; `6 September 2026` in prose; `Sep 2026` in the
  Writing lists.
- Meta separator is `·`.
- The writing wing is called **Writing**, never "personal" or "misc".
