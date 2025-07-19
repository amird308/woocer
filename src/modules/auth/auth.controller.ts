import { All, Controller, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { toNodeHandler } from 'better-auth/node';
import { auth } from 'src/common/better-auth/lib/auth';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@Controller()
export class AuthController {
  @ApiExcludeEndpoint()
  @All('api/auth/*')
  async handleAuth(@Req() req: Request, @Res() res: Response) {
    // Pass the request to Better Auth
    return toNodeHandler(auth)(req, res);
  }
}
