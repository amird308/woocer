import { auth } from './lib/auth';
import { Request } from 'express';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}
  async getSession(request: Request) {
    const headers = new Headers();

    // Copy headers from Express request to Headers object
    for (const [key, value] of Object.entries(request.headers)) {
      if (typeof value === 'string') {
        headers.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => headers.append(key, v));
      }
    }

    // Get the session using auth API
    return auth.api.getSession({ headers });
  }

  async hasPermission(request: Request, permissions: Record<string, string[]>) {
    const headers = new Headers();

    // Copy headers from Express request to Headers object
    for (const [key, value] of Object.entries(request.headers)) {
      if (typeof value === 'string') {
        headers.append(key, value);
      } else if (Array.isArray(value)) {
        value.forEach((v) => headers.append(key, v));
      }
    }

    // Check permissions using auth API
    return auth.api.hasPermission({
      headers,
      body: { permissions },
    });
  }
}
