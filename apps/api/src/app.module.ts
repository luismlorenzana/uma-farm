import { resolve } from 'node:path'
import { AuthModule, authMode } from '@luismlorenzana/uma-server/auth'
import { ReleaseProxyModule } from '@luismlorenzana/uma-server/content'
import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { HealthController } from './health.controller'
import { PingController, PING_VERIFIER, googleVerifier } from './post/ping.controller'
import { PushModule } from './push/push.module'
import { SaveModule } from './save/save.module'
import { storyPackModule } from './story/story-pack'

// Every route sits behind the shared owner guard: a Firebase ID token for the owner's email, or the
// fixed local user with AUTH_MODE=disabled. `@Public()` opens a route: /api/health, and the parcel ping and the push tick
//, which check their own tokens. Master data comes through uma-server's proxy, from uma-platform's bucket in
// production and its local release folder in dev. The story pack is the farm's one private pack, at
// `/api/content/…`: `STORY_BUCKET` in production, `STORY_DIR` locally, 404 with neither.
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
    storyPackModule(),
    SaveModule,
    PushModule,
  ],
  controllers: [HealthController, PingController],
  providers: [{ provide: PING_VERIFIER, useFactory: googleVerifier }],
})
export class AppModule {}
