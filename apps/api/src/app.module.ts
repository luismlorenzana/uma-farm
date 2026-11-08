import { AuthModule, authMode } from '@luismlorenzana/uma-server/auth'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { HealthController } from './health.controller'
import { SaveController } from './save.controller'
import { PingController, PING_VERIFIER, googleVerifier } from './post/ping.controller'

// Every route sits behind the shared owner guard (uma-platform P54): a Firebase ID token for the owner's email, or the
// fixed local user with AUTH_MODE=disabled. `@Public()` opens a route.
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ mode: authMode(config.get<string>('AUTH_MODE')), allowedEmail: config.get<string>('ALLOWED_EMAIL') ?? '' }),
    }),
  ],
  controllers: [HealthController, SaveController, PingController],
  providers: [{ provide: PING_VERIFIER, useFactory: googleVerifier }],
})
export class AppModule {}
