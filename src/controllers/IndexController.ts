import fs from "fs";
import {
    Connection,
    Keypair,
    Transaction,
    clusterApiUrl,
    TransactionInstruction,
    sendAndConfirmTransaction,
    Commitment,
    PublicKey,
} from '@solana/web3.js';
import { Request, Response } from "express";
import { updateMetadata } from "../actions";
import { Program, Provider, Wallet } from "@project-serum/anchor";
import axios from 'axios';
import path, { dirname } from "path";
import { decodeMetadata, getMetadata, getStakeUserPubkey, getStakeUserStorePubkey, poolPublicKey, programId } from "../utils";
import { arweaveUpload } from "../helpers/upload/arweave";

const idl = JSON.parse(fs.readFileSync(path.resolve(__dirname, "../../nft_staking.json")).toString());
const rawdata = fs.readFileSync(path.resolve(__dirname, "../../id.json"));
const keyData = JSON.parse(rawdata.toString());
const walletKeyPair = Keypair.fromSecretKey(new Uint8Array(keyData));

const udpateAuthorityRawdata = fs.readFileSync(path.resolve(__dirname, "../../update_authority.json"));
const udpateAuthorityKeyData = JSON.parse(udpateAuthorityRawdata.toString());
const udpateAuthorityKeyPair = Keypair.fromSecretKey(new Uint8Array(udpateAuthorityKeyData));

// devnet, mainnet-beta, testnet
const ENV = 'mainnet-beta';
// @ts-ignore
const connection = new Connection(
    // clusterApiUrl(ENV),
    "https://solana-api.projectserum.com",
    "confirmed"
);
const opts = {
    preflightCommitment: "processed" as Commitment
};
export async function updateMetaDataAction(req: Request, res: Response) {
    const { nftMint, wallet, storeId } = req.body;
    const adminWallet = new Wallet(walletKeyPair);
    const provider = new Provider(
        connection, adminWallet, opts
    );
    const publicKey = new PublicKey(wallet);
    const program = new Program(idl, programId, provider);
    const [userPubkey] = await getStakeUserPubkey(publicKey);
    const [storePubkey] = await getStakeUserStorePubkey(publicKey, storeId);
    const poolObject = await program.account.pool.fetch(poolPublicKey);

    const storeObject = await program.account.userStore.fetch(storePubkey);
    const stakedTime = storeObject.stakedTimes.find((time: any, ind: number) => storeObject.nftMints[ind].toBase58() === nftMint);
    const stakedType = storeObject.types.find((ty: number, ind: number) => storeObject.nftMints[ind].toBase58() === nftMint);
    const diffDays = ((new Date()).getTime() / 1000 - stakedTime.toNumber()) / (24 * 3600);
    const stakeTypeDays = poolObject['stakePeriod' + (stakedType + 1)];
    if (diffDays < stakeTypeDays) {
        return res.json("Not finished");
    }

    const metaPubkey = await getMetadata(new PublicKey(nftMint));
    const metadataObj = await connection.getAccountInfo(metaPubkey);
    if (metadataObj === null) {
        return res.json("invalied nft mint");
    }

    let metadataDecoded = decodeMetadata(
        Buffer.from(metadataObj.data),
    );
    console.log(encodeURI(decodeURI(metadataDecoded.data.uri)).replace(/%00/g, ''));
    const { data } = await axios.get(encodeURI(decodeURI(metadataDecoded.data.uri)).replace(/%00/g, ''));
    let attributes: any = data.attributes;
    if (stakedType === 0) {
        let flag = false;
        for (let i = 0; i < attributes.length; i++) {
            if (attributes[i].trait_type == "Craftsmen") {
                attributes[i].value = parseInt(attributes[i].value) + 1;
                flag = true;
                break;
            }
        }

        if (!flag) {
            attributes.push({
                "trait_type": "Craftsmen",
                "value": "1"
            })
        }
        // attributes.push({
        //     "trait_type": "Discover-Mania",
        //     "value": "75"
        // })
        // attributes.push({
        //     "trait_type": "Numerological",
        //     "value": "30"
        // })
        // attributes.push({
        //     "trait_type": "Rhythmic",
        //     "value": "10"
        // })
        // attributes.push({
        //     "trait_type": "Muddle-Solver",
        //     "value": "8"
        // })
    } else if (stakedType === 1) {
        let flag = false;
        for (let i = 0; i < attributes.length; i++) {
            if (attributes[i].trait_type == "Phenomenology") {
                attributes[i].value = parseInt(attributes[i].value) + 1;
                flag = true;
                break;
            }
        }

        if (!flag) {
            attributes.push({
                "trait_type": "Phenomenology",
                "value": "1"
            })
        }
        // attributes.push({
        //     "trait_type": "Chemist-Alchemy",
        //     "value": "75"
        // })
        // attributes.push({
        //     "trait_type": "Soothsayer",
        //     "value": "30"
        // })
    } else {
        let flag = false;
        for (let i = 0; i < attributes.length; i++) {
            if (attributes[i].trait_type == "Deviser") {
                attributes[i].value = parseInt(attributes[i].value) + 1;
                flag = true;
                break;
            }
        }

        if (!flag) {
            attributes.push({
                "trait_type": "Deviser",
                "value": "1"
            })
        }
    }
    const metadataBuffer = Buffer.from(JSON.stringify({
        ...data,
        attributes
    }));
    let newUri = '';
    try {
        newUri = await arweaveUpload(walletKeyPair, connection, ENV, metadataBuffer)
    } catch (e: any) {
        return res.json("");
    }
    if (newUri === '') {
        return res.json("SOL amount not enough or network error");
    }

    const instructions: TransactionInstruction[] = [];
    await updateMetadata(
        metadataDecoded,
        newUri,
        undefined,
        undefined,
        nftMint,
        'DQkywDHnjAD1vD8iRs3zFEdAZyiMsQg1NxUG5AQNTS9L',
        instructions
    );

    const transaction = new Transaction().add(...instructions);
    const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [walletKeyPair, udpateAuthorityKeyPair]
    );
    console.log(signature)

    return res.json(signature);
    return res.json("error");
}
export async function updateAuthorityAction(req: Request, res: Response) {
    const mintKey = req.params.mintKey;
    if (!mintKey) {
        return res.json("mintKey field required");
    }
    const instructions: TransactionInstruction[] = [];
    await updateMetadata(
        undefined,
        undefined,
        'DQkywDHnjAD1vD8iRs3zFEdAZyiMsQg1NxUG5AQNTS9L',
        undefined,
        mintKey,
        '9Rg87qPHZXGtH9MjetoFSiCte1yiB6dn5GxBWGuLkNAY',
        instructions
    );

    const transaction = new Transaction().add(...instructions);
    const signature = await sendAndConfirmTransaction(
        connection,
        transaction,
        [walletKeyPair, udpateAuthorityKeyPair]
    );
    console.log(signature)

    return res.json(signature);
}
export async function updateAuthorityFromJsonAction(req: Request, res: Response) {

    // devnet, mainnet-beta, testnet
    // @ts-ignore
    const connection = new Connection(
        clusterApiUrl("mainnet-beta"),
        "confirmed"
    );
    const mintData = fs.readFileSync(path.resolve(__dirname, '../../', 'mint_list.json'));
    const mintArray = JSON.parse(mintData.toString());
    if (!mintArray.length) {
        return res.json("Mints empty");
    }
    let instructions: TransactionInstruction[] = [];
    for (const mintKey of mintArray) {
        await updateMetadata(
            undefined,
            undefined,
            'DQkywDHnjAD1vD8iRs3zFEdAZyiMsQg1NxUG5AQNTS9L',
            undefined,
            mintKey,
            '9Rg87qPHZXGtH9MjetoFSiCte1yiB6dn5GxBWGuLkNAY',
            instructions
        );
        if (instructions.length == 10) {
            const transaction = new Transaction().add(...instructions);
            const signature = await sendAndConfirmTransaction(
                connection,
                transaction,
                [walletKeyPair, udpateAuthorityKeyPair]
            );
            console.log(signature)
            instructions = [];
        }
    }

    if (instructions.length > 0) {
        const transaction = new Transaction().add(...instructions);
        const signature = await sendAndConfirmTransaction(
            connection,
            transaction,
            [walletKeyPair, udpateAuthorityKeyPair]
        );
        console.log(signature)

        return res.json(signature);
    }
    return res.json("success");
}