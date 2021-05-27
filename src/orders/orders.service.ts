/**
 * Order 서비스.
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import { CreateOrderInput, CreateOrderOutput } from './dtos/create-order.dto';
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
}
