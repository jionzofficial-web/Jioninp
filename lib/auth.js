import { jwtVerify, SignJWT } from 'jose';

const getJwtSecretKey = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET is not defined');
    }
    return new TextEncoder().encode(secret);
};

export async function signJwtToken(payload) {
    const secret = getJwtSecretKey();
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30m')
        .sign(secret);
}

export async function verifyJwtToken(token) {
    try {
        const secret = getJwtSecretKey();
        const { payload } = await jwtVerify(token, secret);
        return payload;
    } catch (error) {
        return null;
    }
}
