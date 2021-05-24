/**
 * restaurant 서비스.
 * restarant의 데이터베이스에 접근하여 데이터를 관리하는 역할.
 * 또한 resolver에게 매핑한 데이터를 넘긴다.
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Repository } from 'typeorm';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { Category } from './entities/category.entity';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryRepository } from './repositories/category.repository';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    private readonly categories: CategoryRepository,
  ) {}

  // 새로운 레스토랑을 만드는 함수. 현재 레스토랑을 만드려는 유저가 owner가 된다.
  async createRestaurant(
    owner: User,
    createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    try {
      const newRestaurant = await this.restaurants.create(
        createRestaurantInput,
      );
      // 현재 로그인한 유저의 정보로 owner를 지정한다.
      newRestaurant.owner = owner;
      // 커스텀한 category Repository의 getOrCreate 함수를 통해 카테고리를 DB에서 가져온다.
      const category = await this.categories.getOrCreate(
        createRestaurantInput.categoryName,
      );
      // 레스토랑과 카테고리의 관계성을 위해, restaurant의 category를 지정하고 레스토랑을 저장한다.
      newRestaurant.category = category;
      await this.restaurants.save(newRestaurant);
      return {
        ok: true,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not create restaurant',
      };
    }
  }

  // 레스토랑 정보를 수정하는 함수.
  async editRestaurant(
    owner: User,
    editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    const restaurant = await this.restaurants.findOne(
      editRestaurantInput.restaurantId,
    );
    /** defensive programming 시작. */
    // 수정할 레스토랑이 DB에 없을 경우,
    if (!restaurant) {
      return {
        ok: false,
        error: 'Restaurant not found',
      };
    }
    // 수정할 레스토랑의 ownerId와, 현재 수정하고자 하는 owner 유저의 Id가 다를 경우,
    if (owner.id !== restaurant.ownerId) {
      return {
        ok: false,
        error: "You can't edit a restaurant that you don't own",
      };
    }
    /** defensive programming 종료. */

    // 사용자가 카테고리를 변경하려는 경우, getOrCreate로 카테코리를 DB에서 가져온다.
    let category: Category = null;
    if (editRestaurantInput.categoryName) {
      category = await this.categories.getOrCreate(
        editRestaurantInput.categoryName,
      );
    }
    // save 함수를 통해, 기존의 restaurant 데이터를 업데이트한다.
    // save 함수로 업데이트를 하기 위해선, 꼭 업데이트 하고자하는 데이터의 'id' 값을 지정해야한다.
    // 만약 category 변수의 값이 null이 아니라면, category object도 함께 업데이트한다.
    await this.restaurants.save([
      {
        id: editRestaurantInput.restaurantId,
        ...editRestaurantInput,
        ...(category && { category }),
      },
    ]);
    return {
      ok: true,
    };
  }
}
