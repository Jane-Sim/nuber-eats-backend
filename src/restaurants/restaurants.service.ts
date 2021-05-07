/**
 * restaurant 서비스.
 * restarant의 데이터베이스에 접근하여 데이터를 관리하는 역할.
 * 또한 resolver에게 매핑한 데이터를 넘긴다.
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, UpdateResult } from 'typeorm';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
import { UpdateRestaurantDto } from './dtos/update-restaurant.dto';
import { Restaurant } from './entities/restaurant.entity';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
  ) {}

  getAll(): Promise<Restaurant[]> {
    return this.restaurants.find();
  }

  // 클라이언트에서 받아온 데이터를 DB에 저장하는 함수.
  // TypeORM의 create, save 함수를 통해 새 restaurant 데이터를 DB에 저장한다.
  // dto, typescript를 이용하여 코드를 단순화 시킨다.
  // save는 Promise를 반환하기에, createRestaurant함수도 Promise 값을 반환한다.
  createRestaurant(
    createRestaurantDto: CreateRestaurantDto,
  ): Promise<Restaurant> {
    const newRestaurant = this.restaurants.create(createRestaurantDto);
    return this.restaurants.save(newRestaurant);
  }

  // 클라이언트에게 받은 UpdateRestaurantDto를 통해 restaurant 데이터를 업데이트한다.
  // update 함수의 첫 번째 파라미터인 criteria는 데이터를 찾는 조건 값.
  // update 함수의 첫 번째 파라미터에는 변경할 데이터를 넣어준다.
  updateRestaurant({ id, data }: UpdateRestaurantDto): Promise<UpdateResult> {
    // return this.restaurants.update({name: "lalala"}, { ...data });
    return this.restaurants.update(id, { ...data });
  }
}
