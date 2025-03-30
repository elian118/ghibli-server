import argon2 from 'argon2';
import { Arg, Field, InputType, Mutation, ObjectType, Resolver } from 'type-graphql';
import { IsEmail, IsString, validate } from 'class-validator';
import User from '../entities/User';
import { createAccessToken } from '../utils/jwt-auth';

@InputType()
export class SignUpInput {
  @Field() @IsEmail() email: string;
  @Field() @IsString() username: string;
  @Field() @IsString() password: string;
}

@InputType()
export class LoginInput {
  @Field() @IsString() emailOrUsername: string;
  @Field() @IsString() password: string;
}

@ObjectType()
export class FieldError {
  @Field() field: string;
  @Field() message: string;
}

@ObjectType()
export class LoginResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;

  @Field({ nullable: true })
  accessToken?: string;
}

@Resolver(User)
export class UserResolver {
  @Mutation(() => User)
  async signUp(@Arg('signUpInput') signUpInput: SignUpInput): Promise<User> {
    const errors = await validate(signUpInput);

    if (errors.length > 0) {
      throw new Error(errors.map((error) => Object.values(error.constraints || {})).join(', '));
    }

    const { email, username, password } = signUpInput;

    const hashedPw = await argon2.hash(password);
    const newUser = User.create({
      email,
      username,
      password: hashedPw,
    });

    await User.insert(newUser);
    return newUser;
  }

  @Mutation(() => LoginResponse)
  public async login(@Arg('loginInput') loginInput: LoginInput): Promise<LoginResponse> {
    const { emailOrUsername, password } = loginInput;

    const user = await User.findOne({ where: [{ email: emailOrUsername }, { username: emailOrUsername }] });
    if (!user) {
      return {
        errors: [{ field: 'emailOrUsername', message: '해당하는 사용자가 없습니다.' }],
      };
    }

    const isValid = await argon2.verify(user.password, password);
    if (!isValid) {
      return {
        errors: [{ field: 'password', message: '비밀번호를 올바르게 입력해주세요.' }],
      };
    }

    const accessToken = createAccessToken(user);
    return { user, accessToken };
  }
}
