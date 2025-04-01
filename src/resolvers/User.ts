import argon2 from 'argon2';
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver, UseMiddleware } from 'type-graphql';
import { IsEmail, IsString, validate } from 'class-validator';
import User from '../entities/User';
import {
  createAccessToken,
  createRefreshToken,
  REFRESH_JWT_SECRET_KET,
  setRefreshTokenHeader,
} from '../utils/jwt-auth';
import { MyContext } from '../apollo/createApolloServer';
import { isAuthenticated } from '../middlewares/isAuthenticated';
import jwt from 'jsonwebtoken';

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

@ObjectType({ description: '엑세스 토큰 새로고침 반환 데이터' })
class RefreshAccessTokenResponse {
  @Field() accessToken: string;
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
  public async login(
    @Arg('loginInput') loginInput: LoginInput,
    @Ctx() { res, redis }: MyContext,
  ): Promise<LoginResponse> {
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
    // 레디스에 사용자별 리프레시 토큰 적재
    await redis.set(String(user.id), refreshToken);
    // 쿠키로 리프레시 토큰 전송
    setRefreshTokenHeader(res, refreshToken);
    return { user, accessToken };
  }

  @Mutation(() => RefreshAccessTokenResponse, { nullable: true })
  async refreshAccessToken(@Ctx() { req, res, redis }: MyContext): Promise<RefreshAccessTokenResponse | null> {
    const refreshToken = req.cookies.refreshtoken;
    // console.log('refreshToken', refreshToken);
    if (!refreshToken) return null;

    let tokenData: any = null;
    try {
      tokenData = jwt.verify(refreshToken, REFRESH_JWT_SECRET_KET);
    } catch (err) {
      console.error(err);
      return null;
    }

    if (!tokenData) return null;

    // 레디스에서 user.id로 저장된 토큰 조회
    const storedRefreshToken = await redis.get(String(tokenData.userId));
    if (!storedRefreshToken) return null;
    if (!(storedRefreshToken === refreshToken)) return null;

    const user = await User.findOne({ where: { id: tokenData.userId } });
    if (!user) return null;

    // 모든 사용자 유효성 검증 후 새 JWT 발행
    const newAccessToken = createAccessToken(user);
    const newRefreshToken = createRefreshToken(user);
    // 레디스에 리프레시 토큰 저장
    await redis.set(String(user.id), newRefreshToken);

    setRefreshTokenHeader(res, newRefreshToken);

    return { accessToken: newAccessToken };
  }
}
