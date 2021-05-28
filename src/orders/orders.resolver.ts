/**
 * Order 리졸버.
 * Order 엔티티와 서비스를 주입해서 사용한다.
 */
import { Inject } from '@nestjs/common';
import { Args, Mutation, Resolver, Query, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Roles } from 'src/auth/role.decorator';
import { PUB_SUB } from 'src/common/common.constants';
import { User } from 'src/users/entities/user.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { Order } from './entities/order.entity';
import { OrderService } from './orders.service';

// order service와,
// app 내부에서 메시지를 교환할 수 있고, 실시간 조회(구독)을 가능하게 하는 PubSub 인스턴스를 @Inject 데코레이터로 가져온다.
@Resolver((of) => Order)
export class OrderResolver {
  constructor(
    private readonly ordersService: OrderService,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  // 고객의 주문으로 order를 생성하는 Mutation
  @Mutation((returns) => CreateOrderOutput)
  @Roles('Client')
  async createOrder(
    @AuthUser() customer: User,
    @Args('input') createOrderInput: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    return this.ordersService.createOrder(customer, createOrderInput);
  }

  //주문 목록을 반환하는 Query
  @Query((returns) => GetOrdersOutput)
  @Roles('Any')
  async getOrders(
    @AuthUser() user: User,
    @Args('input') getOrdersInput: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    return this.ordersService.getOrders(user, getOrdersInput);
  }

  //하나의 주문을 반환하는 Query
  @Query((returns) => GetOrderOutput)
  @Roles('Any')
  async getOrder(
    @AuthUser() user: User,
    @Args('input') getOrderInput: GetOrderInput,
  ): Promise<GetOrderOutput> {
    return this.ordersService.getOrder(user, getOrderInput);
  }

  // 주문 상태를 변경하는 Mutation
  @Mutation((returns) => EditOrderOutput)
  @Roles('Any')
  async editOrder(
    @AuthUser() user: User,
    @Args('input') editOrderInput: EditOrderInput,
  ): Promise<EditOrderOutput> {
    return this.ordersService.editOrder(user, editOrderInput);
  }

  // 생성한 실시간 조회(구독)을 실행시키는 publish 함수.
  // publish (트리거 이름, payload) 두 개의 인자가 필요하다.
  // payload에는, {트리거를 만든 함수의 이름 : 하고자 하는 동작} 을 넣는다.
  @Mutation((returns) => Boolean)
  async potatoReady(@Args('potatoId') potatoId: number) {
    await this.pubSub.publish('hotPotatos', {
      readyPotato: potatoId,
    });
    return true;
  }

  // pubsub의 asyncIterator로 실시간 구독의 트리거를 생성한다.
  // asyncIterator(트리거 이름) DB에 저장하지 않는 데이터를 pubSub으로 유저에게 보낼 때 유용하다.
  // ------------------------------------
  // 특정 조건에 해당되는 실시간 구독을 받고 싶을 때, filter 기능을 사용한다. true, false 값을 반환하자.
  // filter(publish에서 보낸 payload, readyPotato에서 설정한 Argument potatoId인 variables, graphqlContext) 3개의 파라미터가 설정되어있다.
  // potatoReady의 potatoI와 readyPotato potatoId가 일치하면,알람을 받게된다.
  // ------------------------------------
  // 사용자가 받는 실시간 구독 내용 형태를 바꾸고 싶을 때 resolve 기능을 사용한다.
  // filter와 비슷한 인자 값을 받으나, info 가 마지막 인자로 추가된다. (payload, args, context, info)
  @Subscription((returns) => String, {
    filter: ({ readyPotato }, { potatoId }) => {
      return readyPotato === potatoId;
    },
    resolve: ({ readyPotato }) =>
      `Your potato with the id ${readyPotato} is ready!`,
  })
  @Roles('Any')
  readyPotato(@Args('potatoId') potatoId: number) {
    return this.pubSub.asyncIterator('hotPotatos');
  }
}
