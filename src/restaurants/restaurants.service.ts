/**
 * restaurant 서비스.
 * restarant의 데이터베이스에 접근하여 데이터를 관리하는 역할.
 * 또한 resolver에게 매핑한 데이터를 넘긴다.
 */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from 'src/users/entities/user.entity';
import { Raw, Repository } from 'typeorm';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import { DeleteDishInput, DeleteDishOutput } from './dtos/delete-dish.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
import { EditDishInput, EditDishOutput } from './dtos/edit-dish.dto';
import {
  EditRestaurantInput,
  EditRestaurantOutput,
} from './dtos/edit-restaurant.dto';
import { RestaurantInput, RestaurantOutput } from './dtos/restaurant.dto';
import { RestaurantsInput, RestaurantsOutput } from './dtos/restaurants.dto';
import {
  SearchRestaurantInput,
  SearchRestaurantOutput,
} from './dtos/search-restaurant.dto';
import { Category } from './entities/category.entity';
import { Dish } from './entities/dish.entity';
import { Restaurant } from './entities/restaurant.entity';
import { CategoryRepository } from './repositories/category.repository';

@Injectable()
export class RestaurantService {
  constructor(
    @InjectRepository(Restaurant)
    private readonly restaurants: Repository<Restaurant>,
    @InjectRepository(Dish)
    private readonly dishes: Repository<Dish>,
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

  // 레스토랑을 삭제하는 함수.
  async deleteRestaurant(
    owner: User,
    { restaurantId }: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    const restaurant = await this.restaurants.findOne(restaurantId);
    try {
      /** defensive programming 시작. */
      // 삭제할 레스토랑이 DB에 없을 경우,
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }
      // 삭제할 레스토랑의 ownerId와, 현재 삭제하고자 하는 owner 유저의 Id가 다를 경우,
      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: "You can't delete a restaurant that you don't own",
        };
      }
      /** defensive programming 종료. */
      await this.restaurants.delete(restaurantId);
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not delete restaurant.',
      };
    }
  }

  // 모둔 카테고리 데이터를 반환하는 함수
  async allCategories(): Promise<AllCategoriesOutput> {
    try {
      const categories = await this.categories.find();
      return {
        ok: true,
        categories,
      };
    } catch (error) {
      return {
        ok: false,
        error: 'Could not load categories.',
      };
    }
  }

  // 특정 카테코리를 가진 레스토랑의 전체 갯수를 반환하는 함수
  countRestaurants(category: Category): Promise<number> {
    return this.restaurants.count({ category });
  }

  // 특정 slug로 카테고리 데이터를 반환한다.
  async findCategoryBySlug({
    slug,
    page,
  }: CategoryInput): Promise<CategoryOutput> {
    try {
      // 해당 카테고리와 연관된 restaurant 들도 가져올 수 있도록,
      // relations 기능을 함께 사용한다.
      const category = await this.categories.findOne({ slug });
      if (!category) {
        return {
          ok: false,
          error: 'category not found.',
        };
      }
      // 프로모션 중인 레스토랑을 먼저 볼 수 있도록, order를 사용해서, isPromoted 속성이 true가 먼저 나열되도록 설정한다.
      // restaurant에서 꺼내오는 데이터 갯수를 25개로 설정하고 (take)
      // 25개 데이터 이후로 꺼내올 수 있도록 설정한다. (skip)
      // page 가 1일 때는, skip이 0이므로, 앞의 25개 데이터를 꺼내오고
      // page 가 2일 때는, skip이 25이므로, 25를 제외한 26번째 데이터부터 25개를 꺼내온다.
      const restaurants = await this.restaurants.find({
        where: {
          category,
        },
        order: {
          isPromoted: 'DESC',
        },
        take: 25,
        skip: (page - 1) * 25,
      });
      const totalResults: number = await this.countRestaurants(category);
      return {
        ok: true,
        restaurants,
        category,
        totalPages: Math.ceil(totalResults / 25),
      };
    } catch {
      return {
        ok: false,
        error: 'Could not load category.',
      };
    }
  }

  // 모든 레스토랑을 paing 하여 반환하는 함수
  async allRestaurants({ page }: RestaurantsInput): Promise<RestaurantsOutput> {
    try {
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        skip: (page - 1) * 25,
        take: 25,
        order: {
          isPromoted: 'DESC',
        },
      });
      return {
        ok: true,
        results: restaurants,
        totalPages: Math.ceil(totalResults / 25),
        totalResults,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not load restaurants',
      };
    }
  }

  // 특정 레스토랑을 반환하는 함수
  async findRestaurantById({
    restaurantId,
  }: RestaurantInput): Promise<RestaurantOutput> {
    try {
      // 해당 restaurant과 관계된 menu도 가져올 수 있도록 relations 설정.
      const restaurant = await this.restaurants.findOne(restaurantId, {
        relations: ['menu'],
      });
      if (!restaurant) {
        return {
          ok: false,
          error: 'restaurant not found.',
        };
      }
      return {
        ok: true,
        restaurant,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not find restaurant.',
      };
    }
  }

  // name 속성으로 레스토랑을 찾는 함수
  async searchRestaurantByName({
    query,
    page,
  }: SearchRestaurantInput): Promise<SearchRestaurantOutput> {
    try {
      // Raw함수를 통해, raw query를 날릴 수 있다. 직접 DB에 접근하는 방식.
      // ILike를 통해, 대소문자 상관없이 Like sql문으로 레스토랑을 찾는다.
      const [restaurants, totalResults] = await this.restaurants.findAndCount({
        where: {
          name: Raw((name) => `${name} ILike '%${query}%'`),
        },
        skip: (page - 1) * 25,
        take: 25,
      });
      return {
        ok: true,
        restaurants,
        totalPages: Math.ceil(totalResults / 25),
        totalResults,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not search for restaurants.',
      };
    }
  }

  // 특정 레스토랑의 Dish를 생성하는 함수
  async createDish(
    owner: User,
    createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    try {
      const restaurant = await this.restaurants.findOne(
        createDishInput.restaurantId,
      );
      /** defensive programming 시작. */
      // 레스토랑이 DB에 없을 경우,
      if (!restaurant) {
        return {
          ok: false,
          error: 'Restaurant not found',
        };
      }
      // 레스토랑의 ownerId와, 현재 owner 유저의 Id가 다를 경우,
      if (owner.id !== restaurant.ownerId) {
        return {
          ok: false,
          error: "You can't delete a restaurant that you don't own",
        };
      }
      /** defensive programming 종료. */
      // Dish의 Input값과, 관계성인 restaurant을 함께 저장한다.
      await this.dishes.save(
        this.dishes.create({ ...createDishInput, restaurant }),
      );
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not create dish.',
      };
    }
  }

  // 특정 레스토랑의 Dish를 수정하는 함수
  async editDish(
    owner: User,
    editDishInput: EditDishInput,
  ): Promise<EditDishOutput> {
    try {
      const dish = await this.dishes.findOne(editDishInput.dishId, {
        relations: ['restaurant'],
      });
      if (!dish) {
        return {
          ok: false,
          error: 'Dish not found',
        };
      }
      // 레스토랑의 ownerId와, 현재 owner 유저의 Id가 다를 경우,
      if (owner.id !== dish.restaurant.ownerId) {
        return {
          ok: false,
          error: "You can't delete a dish that you don't own",
        };
      }
      await this.dishes.save([
        {
          id: editDishInput.dishId,
          ...editDishInput,
        },
      ]);
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not edit dish.',
      };
    }
  }

  // 특정 레스토랑의 Dish를 삭제하는 함수
  async deleteDish(
    owner: User,
    { dishId }: DeleteDishInput,
  ): Promise<DeleteDishOutput> {
    try {
      // dish와 관련된 restaurant의 owner id를 가져오기 위해, relations 기능 추가
      const dish = await this.dishes.findOne(dishId, {
        relations: ['restaurant'],
      });
      if (!dish) {
        return {
          ok: false,
          error: 'Dish not found',
        };
      }
      // 레스토랑의 ownerId와, 현재 owner 유저의 Id가 다를 경우,
      if (owner.id !== dish.restaurant.ownerId) {
        return {
          ok: false,
          error: "You can't delete a dish that you don't own",
        };
      }
      await this.dishes.delete(dishId);
      return {
        ok: true,
      };
    } catch {
      return {
        ok: false,
        error: 'Could not delete dish.',
      };
    }
  }
}
