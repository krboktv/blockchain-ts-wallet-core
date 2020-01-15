import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EthereumClassicRoutingModule } from './ethereumClassic-routing.module';
import { SendModule } from '../../../../send/send.module';
import { INodeApiProvider } from '../../../providers/node-api.provider';
import { CurrencyFactoryOptions, SharedModule } from '../../../shared.module';
import { Ethereum } from '../../../../../../../lib/ts-wallet-core/src/DomainCurrency';
import { getPrivateKey } from '../currencies.utils';
import { EthereumBasedService } from '../services/ethereumBased.service';
import TsWalletCore from '../../../../../../../lib/ts-wallet-core/src/ts-wallet-core';

export function init(utils: INodeApiProvider, opt: CurrencyFactoryOptions) {
  const currency = Ethereum.Instance();
  const privateKey = getPrivateKey(currency, opt);
  const blockchain = TsWalletCore.Ethereum(privateKey);
  return new EthereumBasedService(privateKey, currency, blockchain, utils);
}

@NgModule({
  declarations: [],
  imports: [
    SharedModule,
    SendModule.forChild({
        init
      },
    ),
    CommonModule,
    EthereumClassicRoutingModule
  ]
})
export class EthereumClassicModule {
}
