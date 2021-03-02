/**
 * restaurant 서비스.
 * restarant의 데이터베이스에 접근하여 데이터를 관리하는 역할.
 * 또한 resolver에게 매핑한 데이터를 넘긴다.
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRestaurantDto } from './dtos/create-restaurant.dto';
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
}
