## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

## User simulation

`node tools/user-sim.mjs` drives the site through goal-directed journeys
(understand what the institute is, find the method, verify the sources, find a
contact) on desktop and mobile, and reports where the path breaks plus
page-level ergonomics: horizontal overflow, heading structure, touch-target
size and colour contrast.

    node tools/user-sim.mjs                  # needs the dev server running
    OUT=/tmp/sim node tools/user-sim.mjs     # log.json + a screenshot per step

A failing journey is a finding about the site, not about the script. The
`contact` journey fails by design: there is no contact route yet.

## Layout audit

`node tools/layout-audit.mjs` walks the DOM of every built route at twelve
widths and reports blocks wider than their container, text clipped by a hidden
overflow, boxes reaching past the viewport, and any table spilling out of its
column. It complements the simulation rather than repeating it: `body` carries
`overflow-x:hidden`, so a block that spills is clipped silently and never shows
up as page-level overflow.

    astro build && node tools/layout-audit.mjs   # needs a server over ./dist
    ORIGIN=http://localhost:4321 node tools/layout-audit.mjs

Exits non-zero when it finds something.
