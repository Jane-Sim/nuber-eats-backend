/**
 * Order 리졸버.
 * Order 엔티티와 서비스를 주입해서 사용한다.
 */
import { Inject } from '@nestjs/common';
import { Args, Mutation, Resolver, Query, Subscription } from '@nestjs/graphql';
import { PubSub } from 'graphql-subscriptions';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Roles } from 'src/auth/role.decorator';
import {
  PUB_SUB,
  NEW_PENDING_ORDER,
  NEW_COOKED_ORDER,
  NEW_ORDER_UPDATE,
} from 'src/common/common.constants';
import { User } from 'src/users/entities/user.entity';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { OrderUpdatesInput } from './dtos/order-updates.dto';
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

  /**
   * pubsub의 asyncIterator로 실시간 구독의 트리거를 생성한다.
   * asyncIterator(트리거 이름) DB에 저장하지 않는 데이터를 pubSub으로 유저에게 보낼 때 유용하다.
   * ------------------------------------
   * 특정 조건에 해당되는 실시간 구독을 받고 싶을 때, filter 기능을 사용한다. true, false 값을 반환하자.
   * filter(publish에서 보낸 payload, 실시간 구독을 실행한 함수의 Argument인 variables, graphqlContext) 3개의 파라미터가 설정되어있다.
   * ------------------------------------
   * 사용자가 받는 실시간 구독 내용 형태를 바꾸고 싶을 때 resolve 기능을 사용한다.
   * filter와 비슷한 인자 값을 받으나, info 가 마지막 인자로 추가된다. (payload, args, context, info)
   * ------------------------------------
   */
  // 특정 restaurnat의 Order가 생성될 때마다, order 데이터를 실시간으로 받는 Subscription.
  // Owner만 실행가능하며, createOrder resolver가 실행되면 NEW_PENDING_ORDER 트리거가 실행된다.
  @Subscription((returns) => Order, {
    // payload에서 pendingOrders의 ownerId와, context에서 user를 꺼낸 뒤
    // 현재 owner 유저의 id와 restaurant의 owner id가 일치하는지 filter 조건으로 설정한다.
    filter: ({ pendingOrders: { ownerId } }, _, { user }) => {
      return ownerId === user.id;
    },
    // 일치하면, payload에서 pendingOrders object에서 order를 꺼내어 반환한다.
    resolve: ({ pendingOrders: { order } }) => order,
  })
  @Roles('Owner')
  pendingOrders(): AsyncIterator<Order> {
    return this.pubSub.asyncIterator(NEW_PENDING_ORDER);
  }

  // owner가 요리완료시, delivery에게 실시간 알람을 받게해주는 Subscription.
  @Subscription((returns) => Order)
  @Roles('Delivery')
  cookedOrders(): AsyncIterator<Order> {
    return this.pubSub.asyncIterator(NEW_COOKED_ORDER);
  }

  // order의 상태가 변경될 때마다, 해당 order 데이터를 실시간으로 받는 Subscription.
  // 해당 오더와 관련있는 owner, client, delivery 전부 전달받는다.
  @Subscription((returns) => Order, {
    // 업데이트된 order와 실시간 구독을 받는 argument인 input의 id, context에 저장된 유저를 가져와
    // 해당 함수를 사용하는 사용자의 id와 해당 order에 속한 owner, client, delivery 중 속한 Role의 id가 일치할 때만 asyncIterator를 반환한다.
    filter: (
      { orderUpdates: order }: { orderUpdates: Order },
      { input }: { input: OrderUpdatesInput },
      { user }: { user: User },
    ) => {
      // 3조건 중 하나도 일치하지 않으면 false를 반환.
      if (
        order.driverId !== user.id &&
        order.customerId !== user.id &&
        order.restaurant.ownerId !== user.id
      ) {
        return false;
      }
      return order.id === input.id;
    },
  })
  @Roles('Any')
  orderUpdates(
    @Args('input') orderUpdatesInput: OrderUpdatesInput,
  ): AsyncIterator<Order> {
    return this.pubSub.asyncIterator(NEW_ORDER_UPDATE);
  }
}
