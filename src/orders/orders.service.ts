/**
 * Order 서비스.
 */
import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PubSub } from 'graphql-subscriptions';
import {
  NEW_COOKED_ORDER,
  NEW_ORDER_UPDATE,
  NEW_PENDING_ORDER,
  PUB_SUB,
} from 'src/common/common.constants';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { EditOrderInput, EditOrderOutput } from './dtos/edit-order.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { TakeOrderInput, TakeOrderOutput } from './dtos/take-order.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order, OrderStatus } from './entities/order.entity';

@Injectable()
export class OrderService {
  constructor(
    @InjectRepository(Order)
    private readonly orders: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItems: Repository<OrderItem>,
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
    @Inject(PUB_SUB) private readonly pubSub: PubSub,
  ) {}

  // order를 생성하는 함수
  async createOrder(
    customer: User,
    { restaurantId, items }: CreateOrderInput,
  ): Promise<CreateOrderOutput> {
    try {
      const restaurant = await this.restaurants.findOne(restaurantId);
      /** defensive programming 시작. */
      // 레스토랑이 DB에 없을 경우,
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }
      /** defensive programming 종료. */

      // 고객이 주문한 order의 총 가격을 할당할 orderFinalPrice 변수.
      let orderFinalPrice = 0;
      // 고객의 Order의 items array를 저장할 변수.
      const orderItems: OrderItem[] = [];

      // forEach 내부에서는 return 을 넣어도, 사용자에게 return 값이 반환되지 않는다.
      // 그렇기에 for of loop를 사용하는게, return 값 반환시에 좋다.
      // 사용자가 선택한 dish(item) 갯수만큼 object를 생성 후, order object에 추가해주자.
      for (const item of items) {
        // 사용자가 선택한 dish를 먼저 찾는다.
        const dish = await this.dishes.findOne(item.dishId);
        if (!dish) {
          return {
            ok: false,
            error: 'Dish not found.',
          };
        }
        // 해당 dish의 가격을 dishFinalPrice에 할당한다.
        let dishFinalPrice = dish.price;

        // 유저가 선택한 dish의 options 금액을 계산하여, total 가격을 측정하자.
        for (const itemOption of item.options) {
          // 선택된 item option의 name을 통해, dish 데이터의 options들을 꺼내온다. (options의 extra 금액 파악 목적)
          const dishOption = dish.options.find(
            (dishOption) => dishOption.name === itemOption.name,
          );
          // dish 옵션에서 extra 금액이 있다면, 해당 extra금액을 dishFinalPrice에 추가한다.
          if (dishOption) {
            if (dishOption.extra) {
              dishFinalPrice += dishOption.extra;
              // 만약 options의 extra 금액이 없다면, choices 안의 extra 금액을 찾는다.
            } else {
              const dishOptionChoice = dishOption.choices.find(
                (optionChoice) => optionChoice.name === itemOption.choice,
              );
              if (dishOptionChoice) {
                if (dishOptionChoice.extra) {
                  dishFinalPrice += dishOptionChoice.extra;
                }
              }
            }
          }
        }
        // dishes들의 합친 가격을 orderFinalPrice에 할당한다.
        orderFinalPrice += dishFinalPrice;

        // 유저의 order에서 선택한 orderItem들을 하나씩 생성한다.
        const orderItem = await this.orderItems.save(
          this.orderItems.create({
            dish,
            options: item.options,
          }),
        );
        // orderItems 배열에 생성한 orderItem Object를 추가한다.
        orderItems.push(orderItem);
      }

      // 주문한 고객과, 선택한 레스토랑, 선택한 orderItems, 총 items의 토탈가격을 orders 데이터로 저장한다.
      const order = await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
          total: orderFinalPrice,
          items: orderItems,
        }),
      );

      /**
       * 생성한 실시간 조회(구독)을 실행시키는 publish 함수.
       * publish (트리거 이름, payload) 두 개의 인자가 필요하다.
       * payload에는, {트리거를 만든 resolver 함수의 이름 : 하고자 하는 동작} 을 넣는다.
       */
      // restaurant owner가 해당 order를 확인할 수 있도록,
      // 생성한 order와 ownerId를 NEW_PENDING_ORDER 트리거를 구독하는 resolver에 반환한다.
      await this.pubSub.publish(NEW_PENDING_ORDER, {
        pendingOrders: { order, ownerId: restaurant.ownerId },
      });
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not create order.',
      };
    }
  }

  // 주문 목록을 반환하는 함수
  // Owner, Client, Delivery마다 반환받는 orders의 데이터가 다르다.
  async getOrders(
    user: User,
    { status }: GetOrdersInput,
  ): Promise<GetOrdersOutput> {
    try {
      let orders: Order[];
      // 고객이 주문 목록을 받고 싶을 때, customer가 현재 유저와 일치하는 주문 목록을 반환.
      if (user.role === UserRole.Client) {
        orders = await this.orders.find({
          where: {
            customer: user,
          },
        });
        // 드라이버가 주문 목록을 받고 싶을 때, driver가 현재 유저와 일치하는 주문 목록을 반환.
      } else if (user.role === UserRole.Delivery) {
        orders = await this.orders.find({
          where: {
            driver: user,
            ...(status && { status }),
          },
        });
        // 레스토랑 주인이 주문 목록을 받고 싶을 때, restaurant의 owner가 현재 유저와 일치하는 주문 목록을 반환.
        // 현재 레스토랑과 연관있는 order 데이터들을 받아온다
      } else if (user.role === UserRole.Owner) {
        const restaurants = await this.restaurants.find({
          where: {
            owner: user,
            ...(status && { status }),
          },
          relations: ['orders'],
        });
        // orders의 배열만 반환할 수 있도록, restaurant에서 order 배열을 꺼내어 새 배열로 반환한다.
        // flat을 이용해 빈 배열은 제거한다.
        orders = restaurants.map((restaurant) => restaurant.orders).flat(1);
        // 만약 주문 상태로 구분한 주문 목록을 보고 싶어한다면, filter 기능으로 반환한다.
        if (status) {
          orders = orders.filter((order) => order.status === status);
        }
      }
      return {
        ok: true,
        orders,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not get orders',
      };
    }
  }

  // 현재 유저가 주문을 볼 수 있는지 체크하는 함수
  canSeeOrder(user: User, order: Order): boolean {
    // 사용자가 해당 함수를 실행할 수 있는지 구분짓는 권한.
    let canSee = true;
    // 사용자의 Role이 고객일때, 등록된 고객 id와 현재 유저의 id가 일치하지 않으면, 주문 조회 불가.
    if (user.role === UserRole.Client && order.customerId !== user.id) {
      canSee = false;
    }
    // 사용자의 Role이 드라이버일때, 등록된 드라이버 id와 현재 유저의 id가 일치하지 않으면, 주문 조회 불가.
    if (user.role === UserRole.Delivery && order.driverId !== user.id) {
      canSee = false;
    }
    // 사용자의 Role이 주인이고, 등록된 레스토랑 주인 id와 현재 유저의 id가 일치하지 않으면, 주문 조회 불가.
    if (user.role === UserRole.Owner && order.restaurant.ownerId !== user.id) {
      canSee = false;
    }
    return canSee;
  }

  // 한 개의 주문을 반환하는 함수
  // 다른 사람의 order를 조회하려는 의도를 막는다.
  async getOrder(
    user: User,
    { id: orderId }: GetOrderInput,
  ): Promise<GetOrderOutput> {
    try {
      // 해당 id의 주문을 가져온다.
      // 주문 조회를 하는 사람이 owner일 경우를 대비해, restaurant 정보를 함께 가져온다.
      const order = await this.orders.findOne(orderId, {
        relations: ['restaurant'],
      });
      // order가 없을 때,
      if (!order) {
        return {
          ok: false,
          error: 'Order not found.',
        };
      }
      // 현재 유저가 해당 주문확인 권한이 없을 때,
      if (!this.canSeeOrder(user, order)) {
        return {
          ok: false,
          error: 'You cant see that',
        };
      }
      // 주문을 반환한다.
      return {
        ok: true,
        order,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not load order.',
      };
    }
  }

  // owner와 delivery 가 해당 주문의 상태를 변경시 사용하는 함수
  async editOrder(
    user: User,
    { id: orderId, status }: EditOrderInput,
  ): Promise<EditOrderOutput> {
    try {
      // 변경하고자 하는 order를 조회한다.
      const order = await this.orders.findOne(orderId);
      if (!order) {
        return {
          ok: false,
          error: 'Order not found.',
        };
      }
      // 현재 유저가 해당 주문확인 권한이 없을 때,
      if (!this.canSeeOrder(user, order)) {
        return {
          ok: false,
          error: "Can't see this.",
        };
      }

      let canEdit = true;
      // 고객은 주문변경 권한이 없다.
      if (user.role === UserRole.Client) {
        canEdit = false;
      }
      // 오너는 Cooking, Cooked 이외의 상태로 변경하지 못한다.
      if (user.role === UserRole.Owner) {
        if (status !== OrderStatus.Cooking && status !== OrderStatus.Cooked) {
          canEdit = false;
        }
      }
      // 라이더는 PickedUp, Delivered 이외의 상태로 변경하지 못한다.
      if (user.role === UserRole.Delivery) {
        if (
          status !== OrderStatus.PickedUp &&
          status !== OrderStatus.Delivered
        ) {
          canEdit = false;
        }
      }
      if (!canEdit) {
        return {
          ok: false,
          error: "You can't do that.",
        };
      }
      // 해당 주문의 상태를 변경한다.
      await this.orders.save({
        id: orderId,
        status,
      });
      // orders.save 함수는, order entity의 모든 정보를 반환하지 않기에,
      // 이전에 가져온 order 정보에, 변경한 status를 적용하여 order를 반환한다.
      const newOrder = { ...order, status };
      // owner가 order status 변경시, delivery에게 알람을 전달하기 위해
      // NEW_COOKED_ORDER 트리거를 구독하는 resolver에 order를 반환한다.
      if (user.role === UserRole.Owner) {
        if (status === OrderStatus.Cooked) {
          await this.pubSub.publish(NEW_COOKED_ORDER, {
            cookedOrders: newOrder,
          });
        }
      }
      // 해당 order와 관련있는 owner, client, delivery에게 status가 변경된 order를 전달한다.
      await this.pubSub.publish(NEW_ORDER_UPDATE, { orderUpdates: newOrder });
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not edit order.',
      };
    }
  }

  // 요리가 다 된 Order에 딜리버리 유저를 추가하여 Order를 업데이트하는 함수.
  async takeOrder(
    driver: User,
    { id: orderId }: TakeOrderInput,
  ): Promise<TakeOrderOutput> {
    try {
      const order = await this.orders.findOne(orderId);
      /** defensive programming 시작. */
      // 해당 Order가 DB에 없을 경우,
      if (!order) {
        return {
          ok: false,
          error: 'Order not found',
        };
      }
      // 해당 Order에 이미 딜리버리가 있는 경우,
      if (order.driver) {
        return {
          ok: false,
          error: 'This order already has a driver',
        };
      }
      /** defensive programming 종료. */
      // order를 업데이트.
      await this.orders.save({
        id: orderId,
        driver,
      });
      // 해당 order와 관련있는 owner, client, delivery에게 새로운 딜리버리가 추가된 order를 전달한다.
      await this.pubSub.publish(NEW_ORDER_UPDATE, {
        orderUpdates: { ...order, driver },
      });
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not upate order.',
      };
    }
  }
}
