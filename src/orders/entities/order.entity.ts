/**
 * order의 entity. core entity를 상속받아서 사용한다.
 * 여러 개의 오더는 1개의 레스토랑, 고객, 드라이버에 종속되며, 여러 개의 dish를 포함한다.
 */

import {
  Field,
  Float,
  InputType,
  ObjectType,
  registerEnumType,
} from '@nestjs/graphql';
import { IsEnum, IsNumber } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Restaurant } from 'src/restaurants/entities/restaurant.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  RelationId,
} from 'typeorm';
import { OrderItem } from './order-item.entity';

/**
 * Pending = 대기상태,
 * Cooking = 조리중,
 * Cooked = 조리완료,
 * PickedUp = 음식 픽업,
 * Delivered = 배달완료,
 */
export enum OrderStatus {
  Pending = 'Pending',
  Cooking = 'Cooking',
  Cooked = 'Cooked',
  PickedUp = 'PickedUp',
  Delivered = 'Delivered',
}

registerEnumType(OrderStatus, { name: 'OrderStatus' });

@InputType('OrderInputType', { isAbstract: true })
@ObjectType() // nest
@Entity() // typeORM
export class Order extends CoreEntity {
  // 1개의 order는 1명의 user를 갖는다. 1명의 user는 여러 개의 order를 갖는다.
  // 유저가 삭제되어도 order는 사라지면 안되기에, nullable을 지정한다.
  // customer가 항상 relations으로 같이 보여지길 원하기에, eager relations 를 추가한다.
  @Field((type) => User, { nullable: true })
  @ManyToOne((type) => User, (user) => user.orders, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  customer?: User;

  @RelationId((order: Order) => order.customer)
  customerId: number;

  // 1개의 order는 1명의 driver를 갖는다. 처음에는 드라이버가 지정되지 않으니, nullable 추가.
  // 드라이버가 삭제되어도 order는 사라지면 안되기에, nullable을 지정한다.
  @Field((type) => User, { nullable: true })
  @ManyToOne((type) => User, (user) => user.rides, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  driver?: User;

  @RelationId((order: Order) => order.driver)
  driverId: number;

  // 여러 개의 order는 1개의 restaurant을 갖는다.
  @Field((type) => Restaurant, { nullable: true })
  @ManyToOne((type) => Restaurant, (restaurant) => restaurant.orders, {
    onDelete: 'SET NULL',
    nullable: true,
    eager: true,
  })
  restaurant?: Restaurant;

  // 여러 order는 여러 dish(OrderItem)을 가질 수 있고, dish도 마찬가지다. @ManyToMany 데코레이터로 관계형을 추가하고,
  // dish에서는 어떤 고객이 해당 dish를 가졌는지는 모르지만,
  // order에서 어떤 고객이 어떤 dish를 시켰는지를 알기 때문에,
  // Order entity에 @JoinTalbe 데코레이터를 추가한다. Order -> Dish로 데이터 접근이 가능 (@ManyToMany 데코레이터를 쓸 경우 표시해야 한다.)
  @Field((type) => [OrderItem])
  @ManyToMany((type) => OrderItem, { eager: true })
  @JoinTable()
  items: OrderItem[];

  @Column({ nullable: true })
  @Field((type) => Float, { nullable: true })
  @IsNumber()
  total?: number;

  // order의 상태를 알려주는 status.
  @Column({ type: 'enum', enum: OrderStatus, default: OrderStatus.Pending })
  @Field((type) => OrderStatus)
  @IsEnum(OrderStatus)
  status: OrderStatus;
}
