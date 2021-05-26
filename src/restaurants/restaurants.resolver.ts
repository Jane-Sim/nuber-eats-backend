/**
 * restaurant 리졸버.
 * restaurant 엔티티와 서비스를 주입해서 사용한다.
 */

import {
  Args,
  Mutation,
  Parent,
  Query,
  ResolveField,
  Resolver,
} from '@nestjs/graphql';
import { AuthUser } from 'src/auth/auth-user.decorator';
import { Roles } from 'src/auth/role.decorator';
import { User } from 'src/users/entities/user.entity';
import { AllCategoriesOutput } from './dtos/all-categories.dto';
import { CategoryInput, CategoryOutput } from './dtos/category.dto';
import { CreateDishInput, CreateDishOutput } from './dtos/create-dish.dto';
import {
  CreateRestaurantInput,
  CreateRestaurantOutput,
} from './dtos/create-restaurant.dto';
import {
  DeleteRestaurantInput,
  DeleteRestaurantOutput,
} from './dtos/delete-restaurant.dto';
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
import { RestaurantService } from './restaurants.service';

// restaurant Resolver 데코레이터. graphql이 스키마를 생성하는데 자동으로 resolver를 찾을 수 있도록 돕는다.
@Resolver((of) => Restaurant)
export class RestaurantResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  // 레스토랑을 생성하는 Mutation. Owner role을 가진 유저만 실행가능.
  // @SetMetadata를 통해, Resolver를 실행시킬 수 있는 권한을 부여할 수 있다.
  // InputType데코레이터를 사용하는 CreateRestaurantInput을 통해, 클라이언트에서 인자 값을 쉽게 받아옴.
  // createRestaurant 서비스의 비동기 함수를 받기 위해 async, await 사용.
  // Restaurant entity를 생성할 때, 로그인 한 유저의 정보를 owner로 지정.
  @Mutation((returns) => CreateRestaurantOutput)
  @Roles('Owner')
  async createRestaurant(
    @AuthUser() authUser: User,
    @Args('input') createRestaurantInput: CreateRestaurantInput,
  ): Promise<CreateRestaurantOutput> {
    return await this.restaurantService.createRestaurant(
      authUser,
      createRestaurantInput,
    );
  }

  // 레스토랑 정보를 수정하는 Mutation. Owner role을 가진 유저만 실행가능.
  @Mutation((returns) => EditRestaurantOutput)
  @Roles('Owner')
  async EditRestaurant(
    @AuthUser() owner: User,
    @Args('input') editRestaurantInput: EditRestaurantInput,
  ): Promise<EditRestaurantOutput> {
    return await this.restaurantService.editRestaurant(
      owner,
      editRestaurantInput,
    );
  }

  // 레스토랑을 삭제하는 Mutation. Owner role을 가진 유저만 실행가능.
  @Mutation((returns) => DeleteRestaurantOutput)
  @Roles('Owner')
  deleteRestaurant(
    @AuthUser() owner: User,
    @Args('input') deleteRestaurantInput: DeleteRestaurantInput,
  ): Promise<DeleteRestaurantOutput> {
    return this.restaurantService.deleteRestaurant(
      owner,
      deleteRestaurantInput,
    );
  }

  // 모든 레스토랑 데이터를 반환.
  @Query((type) => RestaurantsOutput)
  restaurants(
    @Args('input') restaurantsInput: RestaurantsInput,
  ): Promise<RestaurantsOutput> {
    return this.restaurantService.allRestaurants(restaurantsInput);
  }

  // id로 하나의 레스토랑을 반환.
  @Query((type) => RestaurantOutput)
  restaurant(
    @Args('input') restaurantInput: RestaurantInput,
  ): Promise<RestaurantOutput> {
    return this.restaurantService.findRestaurantById(restaurantInput);
  }

  // query로 하나의 레스토랑을 반환.
  @Query((type) => SearchRestaurantOutput)
  searchRestaurant(
    @Args('input') searchRestaurantInput: SearchRestaurantInput,
  ): Promise<SearchRestaurantOutput> {
    return this.restaurantService.searchRestaurantByName(searchRestaurantInput);
  }
}

// category Resolver
@Resolver((of) => Category)
export class CategoryResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  // 매 request마다 계산된 field(속성 값)을 제공하는 @ResolveField 데코레이터.
  // restaurantCount 필드는 부모 category로 지정된 restaurant의 갯수를 반환한다.
  // graphql로 사용방법 => { allCatagories { categories { restaurantCount } } }
  @ResolveField((type) => Number)
  restaurantCount(@Parent() category: Category): Promise<number> {
    return this.restaurantService.countRestaurants(category);
  }

  // 모든 카테고리 데이터를 반환한다.
  @Query((type) => AllCategoriesOutput)
  allCategories(): Promise<AllCategoriesOutput> {
    return this.restaurantService.allCategories();
  }

  // 특정 slug로 카테고리 데이터를 반환한다.
  @Query((type) => CategoryOutput)
  category(
    @Args('input') categoryInput: CategoryInput,
  ): Promise<CategoryOutput> {
    return this.restaurantService.findCategoryBySlug(categoryInput);
  }
}

// Dish Resolver
@Resolver((of) => Dish)
export class DishResolver {
  constructor(private readonly restaurantService: RestaurantService) {}

  // Owner만 사용가능한, Restaurant의 dish를 생성하는 Mutation
  @Mutation((returns) => CreateDishOutput)
  @Roles('Owner')
  createDish(
    @AuthUser() owner: User,
    @Args('input') createDishInput: CreateDishInput,
  ): Promise<CreateDishOutput> {
    return this.restaurantService.createDish(owner, createDishInput);
  }
}
