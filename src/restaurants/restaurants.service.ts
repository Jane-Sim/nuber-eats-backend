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
import { Category } from './entities/category.entity';
import { Restaurant } from './entities/restaurant.entity';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(Category)
    private readonly categories: Repository<Category>,
  ) {}

  // 새로운 레스토랑을 만드는 함수. 현재 레스토랑을 만드려는 유저가 owner가 된다.
  //
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
      // trim: 문자열 양 끝 공백 제거. toLowerCase: 소문자로 변경.
      // categoryName을 owner마다 다르게 적을 수 있으니, 비슷한 이름으로 저장되도록 포맷 진행.
      const categoryName = createRestaurantInput.categoryName
        .trim()
        .toLowerCase();
      // 카테고리 페이지의 URL 경로를 표시하는 slug를 저장. 공백마다 "-" 표시.
      const categorySlug = categoryName.replace(/ /g, '-');

      // 먼저, owner가 지정한 카테고리가 존재하는지 확인한 다음,
      let category = await this.categories.findOne({ slug: categorySlug });
      // 없는 카테고리면, 카테고리를 생성하고, 저장한다.
      if (!category) {
        category = await this.categories.save(
          this.categories.create({ slug: categorySlug, name: categoryName }),
        );
      }
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
}
