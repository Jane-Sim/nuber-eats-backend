/**
 * order의 dish items인 orderItem entity.
 */
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Dish } from 'src/restaurants/entities/dish.entity';
import { Column, Entity, ManyToOne } from 'typeorm';

// Order와 OrderItem을 만들기 위해, 필요한 제목(name)과 선택한 항목(choice)을 지닌 type OrderItemOption.
@InputType('OrderItemOptionInputType', { isAbstract: true })
@ObjectType()
export class OrderItemOption {
  @Field((type) => String)
  name: string;
  @Field((type) => String, { nullable: true })
  choice?: string;
}

// orderItem의 dishId 와 options들을 속성 값으로 지정한다.
@InputType('OrderItemInputType', { isAbstract: true })
@ObjectType() // nest
@Entity() // typeORM
export class OrderItem extends CoreEntity {
  @ManyToOne((type) => Dish, { nullable: true, onDelete: 'CASCADE' })
  dish: Dish;

  @Field((type) => [OrderItemOption], { nullable: true })
  @Column({ type: 'json', nullable: true })
  options?: OrderItemOption[];
}
