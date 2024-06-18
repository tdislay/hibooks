import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
} from "@nestjs/common";
import { UserPasswordOmitted, UsersService } from "./users.service";

@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get(":userId")
  async getUser(@Param("userId") userId: number): Promise<UserPasswordOmitted> {
    const user = await this.usersService.getById(userId);

    if (!user) {
      throw new HttpException("User not found", HttpStatus.NOT_FOUND);
    }

    return user;
  }
}
