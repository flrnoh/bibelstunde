import { SignJWT, jwtVerify } from 'jose';

const TOKEN_TTL = '30d';

function secret() {
  const s = process.env.JWT_SECRET;
  if (!s) throw new Error('JWT_SECRET is not set');
  return new TextEncoder().encode(s);
}

export async function signSessionToken({ sub, name }) {
  return await new SignJWT({ name })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(sub)
    .setIssuedAt()
    .setExpirationTime(TOKEN_TTL)
    .sign(secret());
}

export async function verifySessionToken(token) {
  const { payload } = await jwtVerify(token, secret(), { algorithms: ['HS256'] });
  return payload;
}
