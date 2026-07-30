# Sample video attribution

`data/videos/` is not tracked in git, so no video ships with the repo. A
fresh clone that runs `make seed` with no arguments falls back to
`SAMPLE_VIDEO_URLS` in `.env`:

- **`Big_Buck_Bunny_720_10s_5MB.mp4`** — a 10-second excerpt of
  _Big Buck Bunny_ (2008), the Blender Institute's "Peach" open-movie
  project, fetched at seed time from a public test-video host.
  - **© copyright 2008, Blender Foundation / [www.bigbuckbunny.org](https://peach.blender.org/)**
  - **License: [Creative Commons Attribution 3.0 (CC-BY 3.0)](https://creativecommons.org/licenses/by/3.0/)**

_Big Buck Bunny_ is a Creative Commons–licensed open movie: you may reuse,
redistribute, and adapt it — including commercially — provided you give proper
attribution to the Blender Foundation. No endorsement by the Blender
Foundation is implied.

To use your own clip, drop an `.mp4` into this directory (see the project
README, "Loading videos"). **Ensure you have the rights to any media you
add**, and don't commit it to a public repo without confirming you're allowed
to redistribute it — `data/videos/*.mp4` is gitignored for exactly this
reason.
