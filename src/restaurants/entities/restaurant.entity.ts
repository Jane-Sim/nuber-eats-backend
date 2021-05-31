/**
 * database에서 사용되는 Restaurant entity.
 *
 * GraphQL의 스키마 타입을 위한 ObjectType 데코레이터.
 * Field 데코레이터로, entity의 Type, nullable 등 설정.
 * 해당 Restaurant entity를 Graphql 스키마로 생성.
 *
 * TypeORM의 Entity 데코레이터를 이용하여, DB에 저장되는 데이터 형식 설정.
 * 설정한 Entity, Column 데코레이터를 이용해
 * 해당 Restaurant entity를 연결한 DB에 테이블을 생성.
 */
import { Field, InputType, ObjectType } from '@nestjs/graphql';
import { IsString, Length } from 'class-validator';
import { CoreEntity } from 'src/common/entities/core.entity';
import { Order } from 'src/orders/entities/order.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, ManyToOne, OneToMany, RelationId } from 'typeorm';
import { Category } from './category.entity';
import { Dish } from './dish.entity';

// InputType과 ObjectType의 name이 겹치지 않도록, InputType에 name을 지정하여 사용한다.
// schema에는 DB에서 인식할 수 있는 Restaurant type과
// graphql, DB에서 인식 가능한 RestaurantInputType이 생성된다.
@InputType('RestaurantInputType', { isAbstract: true })
@ObjectType() // nest
@Entity() // typeORM
export class Restaurant extends CoreEntity {
  @Field((type) => String) // nest(gql)
  @Column() // typeORM
  @IsString() // validation
  @Length(5) // validation
  name: string; // nest(typescript)

  @Field((type) => String)
  @Column()
  @IsString()
  coverImg: string;

  @Field((type) => String, { defaultValue: '강남' })
  @Column()
  @IsString()
  address: string;

  // 1개의 카테고리는 다수의 레스토랑을 지니고 있다.
  // 특정 카테고리가 삭제되면, 해당 카테고리를 참고하는 레스토랑들이 삭제되면 안되기에
  // 레스토랑의 카테고리 속성 값은 nullable 하며, 카테고리가 삭제되면 NULL로 SET 쿼리를 사용해서 속성을 null로 만든다.
  @Field((type) => Category, { nullable: true })
  @ManyToOne((type) => Category, (category) => category.restaurants, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  category?: Category;

  // 1명의 오너는 여러 개의 레스토랑을 지니고 있다.
  // 레스토랑은 오너가 존재해야 하며, 오너가 없으면 레스토랑도 사라진다.
  @Field((type) => User)
  @ManyToOne((type) => User, (user) => user.restaurants, {
    onDelete: 'CASCADE',
  })
  owner: User;

  // 1개의 레스토랑은 여러 개의 오더(주문)을 가질 수 있다.
  @Field((type) => [Order])
  @OneToMany((type) => Order, (Order) => Order.restaurant)
  orders: Order[];

  // 위의 TypeOrm relationship으로 가져오는 User 타입의 Owner 속성 값에서 id 값만 가져오기 부담이거나 번거로울 때,
  // RelationId 데코레이터를 통해, 해당 Owner의 Id 값만 가져올 수 있게끔 설정할 수 있다.
  // (Owner의 forigen key 값만 find, findOne 등 함수를 통해 가져올 수 있게 된다.)
  @RelationId((restaurant: Restaurant) => restaurant.owner)
  ownerId: number;

  // restaurant foreign key를 가진 category를 가져올 수 있도록 관계형 추가.
  @Field((type) => [Dish])
  @OneToMany((type) => Dish, (dish) => dish.restaurant)
  menu: Dish[];

  // 해당 레스토랑이 promotion으로 홍보 중인지 여부.
  @Field((type) => Boolean)
  @Column({ default: false })
  isPromoted: boolean;

  // promotion의 기간인 Until 속성 값.
  @Field((type) => Date, { nullable: true })
  @Column({ nullable: true })
  promotedUntil: Date;
}
