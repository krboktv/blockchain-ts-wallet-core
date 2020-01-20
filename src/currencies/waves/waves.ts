import { transfer } from 'waves-transactions';
import { ITransferTransaction } from 'waves-transactions/transactions';
import { address } from '@waves/ts-lib-crypto';
import { ICurrency, MnemonicDescriptor, WavesDecimals, WavesTransactionParams } from '../../types';
import { FromDecimal } from '../../blockchain.utils';
import { getWavesKeyPair } from '../../hd-wallet';
import { Buffer } from 'buffer';
import { box } from 'tweetnacl';
import * as basex from 'base-x';

export function Waves(secret: string | MnemonicDescriptor): ICurrency {
  if (secret instanceof MnemonicDescriptor) {
    const keyPair = getWavesKeyPair(secret.phrase, secret.index, secret.password);
    return new WavesCurrency(keyPair.privateKey);
  }
  return new WavesCurrency(secret);
}

export class WavesCurrency implements ICurrency {
  private readonly address: string;

  constructor(private readonly privateKey: string) {
    const bufferKey = new Buffer(privateKey, 'hex');
    const publicKey = box.keyPair.fromSecretKey(new Uint8Array(bufferKey)).publicKey;
    const base58PubKey = basex('123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz').encode(
      new Buffer(publicKey)
    );
    this.address = address({ publicKey: base58PubKey });
  }

  getAddress(): string {
    return this.address;
  }

  signTransaction(params: WavesTransactionParams): Promise<string> {
    const timestamp = Date.now();
    const signedTx: ITransferTransaction = transfer(
      {
        amount: FromDecimal(params.amount, WavesDecimals).toNumber(),
        recipient: params.toAddress,
        timestamp
      },
      this.privateKey
    );

    return Promise.resolve(JSON.stringify(signedTx));
  }
}
