import {
    PublicKey,
} from '@solana/web3.js';
import { METADATA_SCHEMA, Metadata } from "./types";
import * as borsh from 'borsh';

export * from './eventEmitter';
export * from './ids';
export * from './programIds';
export * as Layout from './layout';
export * from './utils';
export * from './useLocalStorage';
export * from './strings';
export * as shortvec from './shortvec';
export * from './isValidHttpUrl';
export * from './borsh';
export * from './createPipelineExecutor';

export const poolPublicKey = new PublicKey("5apLYxdv9rXyXL2QrBCNsEe8DnFw3Fc2BFur4oEoXnpH");;
export const programId = new PublicKey("HmyLxMun11rvkBHuXXyMd5dEAJ7TRpbmnVH5re4TsEqr");
export async function getStakeUserPubkey(walletPubkey: PublicKey) {
    return await PublicKey.findProgramAddress(
        [walletPubkey.toBuffer(), poolPublicKey.toBuffer(), (new TextEncoder().encode('user'))],
        programId
    );
}

export async function getStakeUserStorePubkey(walletPubkey: PublicKey, storeId: number) {
    return await PublicKey.findProgramAddress(
        // @ts-ignore
        [walletPubkey.toBuffer(), poolPublicKey.toBuffer(), (new TextEncoder().encode('user')), [storeId]],
        programId
    );
}

export async function getPoolSigner() {
    return await PublicKey.findProgramAddress(
        [poolPublicKey.toBuffer()],
        programId
    );
}

export async function getVaultPubkey() {
    return await PublicKey.findProgramAddress(
        [poolPublicKey.toBuffer(), (new TextEncoder().encode('vault'))],
        programId
    );
}

export async function getCmPerTokenRewards() {
    return await PublicKey.findProgramAddress(
        [
            poolPublicKey.toBuffer(),
            (new TextEncoder().encode('reward_per_token'))
        ],
        programId
    );

}
export const getMetadata = async (mint: PublicKey) => {
    const TOKEN_METADATA_PROGRAM_ID = new PublicKey(
        'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
    );
    return (
        await PublicKey.findProgramAddress(
            [
                Buffer.from('metadata'),
                TOKEN_METADATA_PROGRAM_ID.toBuffer(),
                mint.toBuffer(),
            ],
            TOKEN_METADATA_PROGRAM_ID,
        )
    )[0];
};

export const decodeMetadata = (buffer: any) => {
    return borsh.deserializeUnchecked(METADATA_SCHEMA, Metadata, buffer);
}
