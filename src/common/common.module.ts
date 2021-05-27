import { Global, Module } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { PUB_SUB } from './common.constants';

// 글로벌하게 사용될 유일한 pubsub 인스턴스.
// pubSub 인스턴스는 독립되어 사용되기에(다른 pubSub 인스턴스와 상호작용X), 하나의 pubSub만 사용해야 한다.
const pubsub = new PubSub();

// 모든 곳에서 pubsub 인스턴스를 사용할 수 있도록 @grobal 데코레이터와 provider에 지정한다.
@Global()
@Module({
  providers: [
    {
      provide: PUB_SUB,
      useValue: pubsub,
    },
  ],
  exports: [PUB_SUB],
})
export class CommonModule {}
