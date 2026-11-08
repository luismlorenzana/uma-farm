import { Controller, Get, NotImplementedException } from '@nestjs/common'

// Behind the owner guard: 401 without a token. There is no save yet; F3 brings save v1.
@Controller('save')
export class SaveController {
  @Get()
  load(): never {
    throw new NotImplementedException('No save yet (F3)')
  }
}
