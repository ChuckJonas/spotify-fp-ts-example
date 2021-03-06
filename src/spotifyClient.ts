import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import * as E from 'fp-ts/Either';
import { flow, identity, pipe } from 'fp-ts/function';
import * as TE from 'fp-ts/TaskEither';
import * as iot from 'io-ts';
import { base64Encode, trace } from './utils';

const makeReq = TE.bimap(
  (e: unknown) => (e instanceof Error ? e : new Error(String(e))),
  (v: AxiosResponse): unknown => v.data,
);

export const httpGet = flow(TE.tryCatchK(axios.get, identity), makeReq);

export const httpPost = flow(TE.tryCatchK(axios.post, identity), makeReq);

const validateJson = <R extends iot.Props>(decoder: iot.TypeC<R>) =>
  flow(
    (json: unknown) => json,
    decoder.decode,
    (v) => E.either.map(v, (artist) => artist),
    E.mapLeft((errors) => new Error(errors.map((error) => error.context.map(({ key }) => key).join('.')).join('\n'))),
  );

const tokenCodec = iot.type({
  access_token: iot.string,
  token_type: iot.string,
  expires_in: iot.number,
});

const getAuth = flow(
  (creds: { clientId: string; secret: string }) => creds,
  (c) => `${c.clientId}:${c.secret}`,
  base64Encode,
  (token: string) =>
    httpPost('https://accounts.spotify.com/api/token', 'grant_type=client_credentials', {
      headers: { Authorization: `Basic ${token}`, 'content-type': 'application/x-www-form-urlencoded' },
    }),
  TE.chain(flow(validateJson(tokenCodec), TE.fromEither)),
);

const artistCodec = iot.type({
  name: iot.string,
  id: iot.string,
});

const artistsCodec = iot.type({
  items: iot.array(artistCodec),
});

const artistsResponseCodec = iot.type({
  artists: artistsCodec,
});

const relatedResponseCodec = iot.type({
  artists: iot.array(artistCodec),
});

export const spotifyClient = (creds: { clientId: string; secret: string }) =>
  pipe(
    getAuth(creds),
    TE.map((authResult) => <R extends iot.Props>(uri: string, decoder: iot.TypeC<R>) =>
      pipe(httpGet(uri, { headers: { Authorization: `Bearer ${authResult.access_token}` } }), TE.chain(flow(validateJson(decoder), TE.fromEither))),
    ),
    TE.map((client) => ({
      searchArtist: (name: string) => client(`https://api.spotify.com/v1/search?q=${name}&type=artist`, artistsResponseCodec),
      relatedArtist: (id: string) => client(`https://api.spotify.com/v1/artists/${id}/related-artists`, relatedResponseCodec),
    })),
  );
