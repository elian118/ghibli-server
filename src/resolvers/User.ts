import argon2 from 'argon2';
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver, UseMiddleware } from 'type-graphql';
import { IsEmail, IsString, validate } from 'class-validator';
import User from '../entities/User';
import { createAccessToken, createRefreshToken } from '../utils/jwt-auth';
import { MyContext } from '../apollo/createApolloServer';
import { isAuthenticated } from '../middlewares/isAuthenticated';

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

@ObjectType({ description: '필드 에러 타입' })
export class FieldError {
  @Field() field: string;
  @Field() message: string;
}

@ObjectType({ description: '로그인 반환 데이터' })
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
  @UseMiddleware(isAuthenticated)
  @Query(() => User, { nullable: true })
  async me(@Ctx() ctx: MyContext): Promise<User | undefined> {
    if (!ctx.verifiedUser) return undefined;
    return User.findOne({ where: { id: ctx.verifiedUser.userId } });
  }

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
  public async login(@Arg('loginInput') loginInput: LoginInput, @Ctx() { res }: MyContext): Promise<LoginResponse> {
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

    // 엑세스 토큰 발급
    const accessToken = createAccessToken(user);
    const refreshToken = createRefreshToken(user);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true, // 자바스크립트로 접근 불가능하도록 설정
      secure: process.env.NODE_ENV === 'production', // 프로덕션 환경은 https 프로토콜에서만 작동
      sameSite: 'lax', // 사이트 내 요청만 허용
    });

    return { user, accessToken };
  }
}
