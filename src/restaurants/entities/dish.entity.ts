/**
 * database에서 사용되는 Dish entity.
 */
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsNumber, IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Column, Entity, ManyToOne, RelationId } from 'typeorm';
import { Restaurant } from './restaurant.entity';

// // 음식의 옵션의 이름과 추가비용. ex) size의 choice는 name: L, extra: 2 / name: XL, extra: 5
@InputType('DishChoiceInputType', { isAbstract: true })
@ObjectType()
export class DishChoice {
  @Field((type) => String)
  name: string;
  @Field((type) => Number, { nullable: true })
  extra?: number;
}

// 음식의 옵션을 설정하는 DishOption. ex) 피자의 맛(name), [하와이안, 치즈크리스피] (choices), 추가비용(extra)
@InputType('DishOptionInputType', { isAbstract: true })
@ObjectType()
export class DishOption {
  @Field((type) => String)
  name: string;
  @Field((type) => [DishChoice], { nullable: true })
  choices?: DishChoice[];
  @Field((type) => Number, { nullable: true })
  extra?: number;
}

@InputType('DishInputType', { isAbstract: true })
@ObjectType()
@Entity()
export class Dish extends CoreEntity {
  @Field((type) => String)
  @Column()
  @IsString()
  @Length(5)
  name: string;

  @Field((type) => Number)
  @Column()
  @IsNumber()
  price: number;

  @Field((type) => String, { nullable: true })
  @Column({ nullable: true })
  @IsString()
  photo?: string;

  @Field((type) => String)
  @Column()
  @Length(5, 140)
  description: string;

  // 1개의 restaurant은 다수의 menu를 지니고 있다.
  // restaurant이 삭제되면, 해당 restaurant과 관계성을 가진 menu들도 삭제하자.
  @Field((type) => Restaurant)
  @ManyToOne((type) => Restaurant, (restaurant) => restaurant.menu, {
    onDelete: 'CASCADE',
  })
  restaurant: Restaurant;

  @RelationId((dish: Dish) => dish.restaurant)
  restaurantId: number;

  // options의 데이터 타입을 json으로 저장하여 생성. MySQL, PostgreSQL만 가능.
  // DishOption의 Entity를 생성하지 않고, json 타입으로 저장해서 DB에서 사용가능.
  @Field((type) => [DishOption], { nullable: true })
  @Column({ type: 'json', nullable: true })
  options?: DishOption[];
}
