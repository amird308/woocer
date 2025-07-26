import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as express from 'express';

const excludeRoutes = ['/api/auth/organization/create'];

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Check if the route matches the auth pattern
    if (
      req.baseUrl.startsWith('/api/auth') &&
      !excludeRoutes.includes(req.baseUrl)
    ) {
      // Skip JSON and URL-encoded body parsing for these routes
      console.log('Skipping body parsing for:', req.baseUrl);
      next();
      return;
    }

    // Otherwise, parse the body as usual
    express.json()(req, res, (err) => {
      if (err) {
        next(err); // Pass any errors to the error-handling middleware
        return;
      }
      express.urlencoded({ extended: true })(req, res, next);
    });
  }
}
