import { Component, Inject, OnInit, ViewEncapsulation } from '@angular/core';
import { NodeApiProvider } from '../shared/providers/node-api.provider';
import { BotBackendProvider } from '../shared/providers/bot-backend.provider';
import { StorageService, Storage, CypherParams } from '../shared/services/storage/storage.service';
import {
  CurrencyFactoryOptions, GetGuid,
  IBlockchainService,
  ICurrencyFactory, PrivateKeys, SignTransactionParams
} from '../shared/shared.module';
import { TransactionResponse } from '../shared/dto/bot-backend.dto';
import { ActivatedRoute } from '@angular/router';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { Decryption } from '../shared/services/send/send.service';

@Component({
  selector: 'app-send',
  templateUrl: './send.component.html',
  styles: [],
  encapsulation: ViewEncapsulation.None
})
export class SendComponent implements OnInit {

  password = '';
  amount = 0;
  toAddress = '';
  hash = '';

  guid: string;
  transactionData: TransactionResponse;

  private bcs: IBlockchainService;

  private storage: Storage;
  private cypherParams: CypherParams;

  constructor(@Inject('SuperService') private currencyFactory: ICurrencyFactory,
              private utils: NodeApiProvider,
              private botApi: BotBackendProvider,
              private storageService: StorageService,
              private route: ActivatedRoute,
              private decryption: Decryption) {
    this.storage = storageService.storage;
    this.cypherParams = storageService.cypherParams;
  }

  asngOnInit() {
    this.guid = GetGuid(this.route, 'tx');

    this.botApi.getTransactionData$(this.guid).pipe(
      tap(async (txData: TransactionResponse) => {
        this.transactionData = txData;
        const sendingMode = this.getSendingMode();
        if (sendingMode === 'fast') {
          await this.executeTransaction(this.storage.secret, 0);
        } else if (sendingMode === 'qrcode') {
          // render upload qr code template
        }
      }),
      catchError((e) => {
        console.log('Find error: ', e);
        return of(e);
      })
    ).subscribe((res) => {
      if (!(res instanceof Error)) {
        console.log('Result: ', res);
      }
    });
  }

  async receiveQrCodeData(qrRawData: string) {
    if (this.password === '') {
      // todo: handle user doesn't entered password
      console.log('empty password');
      return;
    }
    const decryptedText = this.decryption.decryptQrCodeData(qrRawData, this.password);
    if (decryptedText instanceof Error) {
      // todo: handle error: from decryption + if the error was thrown
      console.log(decryptedText);
      return;
    }
    console.log(decryptedText);
    // todo: get derivationPath from backend
    await this.executeTransaction(decryptedText, 0);
  }

  private async executeTransaction(secret: string | PrivateKeys, path: number) {
    const opt: CurrencyFactoryOptions = { secret, password: '', derivationPath: path };
    this.bcs = this.currencyFactory.init(this.utils, opt);
    const transactionParams: SignTransactionParams = {
      toAddress: this.transactionData.to,
      amount: this.transactionData.value
    };
    const signedTx = await this.bcs.signTransaction$(transactionParams, this.guid).toPromise();
    this.hash = await this.bcs.sendTransaction$(signedTx, this.guid).toPromise();
    this.botApi.sendTransactionData$(this.hash, this.guid).subscribe();
  }

  private getSendingMode(): string {
    if (this.storage.secret) {
      return 'fast';
    }
    return 'qrcode';
  }
}
