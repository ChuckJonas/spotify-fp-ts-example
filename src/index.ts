import * as A from 'fp-ts/Array';
import { eqString } from 'fp-ts/Eq';
import { flow, pipe } from 'fp-ts/function';
import { fold, Semigroup } from 'fp-ts/lib/Semigroup';
import * as T from 'fp-ts/Task';
import * as TE from 'fp-ts/TaskEither';
import { spotifyClient } from './spotifyClient';
import * as dotenv from 'dotenv';
dotenv.config();

const semigroupIntersection: Semigroup<string[]> = {
  concat: (x, y) => A.intersection(eqString)(x)(y),
};

const semigroupAll: Semigroup<string[]> = {
  concat: (x, y) => [...x, ...y],
};

const all = fold(semigroupAll);

const intersect = fold(semigroupIntersection);

const artistIntersection = flow((relatedLists: readonly string[][]) => intersect(all([], relatedLists), relatedLists));

const related = (client: ReturnType<typeof spotifyClient>) => (artist: string) =>
  pipe(
    client,
    TE.chain((client) =>
      pipe(
        client.searchArtist(artist),
        TE.map((sr) => pipe(sr.artists.items, A.head)),
        TE.chain(TE.fromOption(() => new Error(`No matching artist found for: ${artist}`))),
        TE.chain((a) =>
          pipe(
            client.relatedArtist(a.id),
            TE.map((related) => ({
              artist: a,
              related: related.artists.map((artist) => artist.name),
            })),
          ),
        ),
      ),
    ),
  );

const main = (artists: string[]) =>
  pipe(
    { clientId: process.env.SPOTIFY_CLIENT_ID as string, secret: process.env.SPOTIFY_CLIENT_SECRET as string },
    spotifyClient,
    related,
    (getRelated) => pipe(artists, A.traverse(TE.taskEither)(getRelated)),
    TE.map((a) => ({
      artists: a.map((i) => i.artist.name),
      related: artistIntersection(a.map((i) => i.related)),
    })),
    TE.map((a) => `Artists related to ${a.artists.join(' & ')}: \n${a.related.join('\n')}`),
    TE.fold(
      (e) => T.of(console.error(e)),
      (a) => T.of(console.log(a)),
    ),
  );

const getNames = pipe(process.argv, (args) => args.slice(2));

pipe(getNames, main)().then();
