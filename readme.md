# spotify-fp-ts-example

A `fp-ts` rewrite of [DrBoolean spotify-fp-example](https://github.com/DrBoolean/spotify-fp-example) covered in his [egghead.io course](https://egghead.io/lessons/javascript-real-world-example-pt1).

## Install & Setup

- `git clone `
- `cd spotify-fp-ts-example`
- `npm install`

### Creating Spotify App
Because spotlight now requires an API token to make requests against it's "public" API, you must [create an app](https://developer.spotify.com/documentation/web-api/quick-start/).

Once you have an app, create a `.env` file in the project root with the following:

```bash
SPOTIFY_CLIENT_ID=YOUR_CLIENT_ID
SPOTIFY_CLIENT_SECRET=YOUR_SECRET
```

## Running

`npm start redman "big l" "the farcyde:"`
