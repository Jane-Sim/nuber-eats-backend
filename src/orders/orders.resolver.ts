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
  // payload는, {트리거를 만든 함수의 이름 : 하고자 하는 동작} 을 넣는다.
  @Mutation((returns) => Boolean)
  potatoReady() {
    this.pubSub.publish('hotPotatos', {
      readyPotato: 'YOur potato is ready. love you.',
    });
    return true;
  }

  // pubsub의 asyncIterator로 실시간 구독의 트리거를 생성한다.
  // asyncIterator(트리거 이름)
  @Subscription((returns) => String)
  readyPotato() {
    return this.pubSub.asyncIterator('hotPotatos');
  }
}
