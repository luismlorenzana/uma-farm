import { resolve } from 'node:path'
import { AuthModule, authMode } from '@luismlorenzana/uma-server/auth'
import { ReleaseProxyModule } from '@luismlorenzana/uma-server/content'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { HealthController } from './health.controller'
import { PingController, PING_VERIFIER, googleVerifier } from './post/ping.controller'
import { SaveModule } from './save/save.module'

// Every route sits behind the shared owner guard (uma-platform P54): a Firebase ID token for the owner's email, or the
// fixed local user with AUTH_MODE=disabled. `@Public()` opens a route: /api/health, and the parcel ping, which checks its
// own token. Master data comes through uma-server's proxy, from uma-platform's bucket in production and its local release
// folder in dev (F3). The farm has no private pack (IN16).
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    AuthModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({ mode: authMode(config.get<string>('AUTH_MODE')), allowedEmail: config.get<string>('ALLOWED_EMAIL') ?? '' }),
    }),
    ReleaseProxyModule.forRoot({
      route: 'master',
      bucket: process.env.MASTER_BUCKET,
      dir: resolve(process.cwd(), process.env.MASTER_DIR ?? '../../../uma-platform/content/release'),
    }),
    SaveModule,
  ],
  controllers: [HealthController, PingController],
  providers: [{ provide: PING_VERIFIER, useFactory: googleVerifier }],
})
export class AppModule {}
