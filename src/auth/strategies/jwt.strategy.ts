    // src/auth/strategies/jwt.strategy.ts
    import { Injectable, UnauthorizedException } from '@nestjs/common';
    import { PassportStrategy } from '@nestjs/passport';
    import { ExtractJwt, Strategy } from 'passport-jwt';
    import { ConfigService } from '@nestjs/config';
    import { UsersService } from 'src/users/users.service';

    @Injectable()
    export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        private usersService: UsersService,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET')!,
        });
    }

    // Hàm này sẽ được tự động gọi sau khi token được xác thực
    async validate(payload: any) {
        // payload chính là { sub: user._id, email: user.email, role: user.role }
        // chúng ta đã ký ở auth.service.ts

        const user = await this.usersService.findOneByEmail(payload.email);
        if (!user) {
        throw new UnauthorizedException();
        }

        // Kiểm tra xem user có bị block không
        if (user.status === 'BLOCKED') {
            throw new UnauthorizedException('User is blocked');
        }

        // Thông tin trả về từ đây sẽ được gán vào request.user
        return { 
            userId: user._id, 
            email: user.email, 
            role: user.role 
        };
    }
    }