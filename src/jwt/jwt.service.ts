import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtService {
  hello(): void {
    console.log('hello');
  }
}
