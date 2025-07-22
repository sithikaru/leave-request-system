export class CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export class LoginDto {
  email: string;
  password: string;
}
