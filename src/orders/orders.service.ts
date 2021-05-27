/**
 * Order 서비스.
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
import { GetOrderInput, GetOrderOutput } from './dtos/get-order.dto';
import { GetOrdersInput, GetOrdersOutput } from './dtos/get-orders.dto';
import { OrderItem } from './entities/order-item.entity';
import { Order } from './entities/order.entity';

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
      await this.orders.save(
        this.orders.create({
          customer,
          restaurant,
          total: orderFinalPrice,
          items: orderItems,
        }),
      );
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
      if (
        user.role === UserRole.Owner &&
        order.restaurant.ownerId !== user.id
      ) {
        canSee = false;
      }
      if (!canSee) {
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
}
