export const base64Encode = (s: string) => Buffer.from(s).toString('base64');

export const trace = <T>(v: T) => {
  console.log(v);
  return v;
};
