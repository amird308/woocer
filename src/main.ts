import { HttpAdapterHost, NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AllExceptionsFilter } from './common/filters/core-exception.filter';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { writeFileSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false, // Disable the global body parser
  });

  const config = new DocumentBuilder()
    .addBearerAuth()
    .addBasicAuth()
    .setTitle('rezsaz API')
    .setDescription('API for rezsaz')
    .setVersion('4.0')
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey: string, methodKey: string) => {
      const controllerWithoutSuffix = controllerKey.replace('Controller', '');
      const controller = controllerWithoutSuffix;
      const method = methodKey.charAt(0).toUpperCase() + methodKey.slice(1);

      return `${controller}${method}`;
    },
  });
  SwaggerModule.setup('api', app, document);

  console.log(process.env.NODE_ENV);
  if (process.env.NODE_ENV === 'development') {
    writeFileSync(
      '../../packages/core-api/open-api.json',
      JSON.stringify(document, null, 2),
    );
  }

  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      forbidNonWhitelisted: true,
      validateCustomDecorators: true,
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter(httpAdapter));
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.enableCors({
    origin: [
      'https://rezsaz.ir',
      'http://localhost:5173',
      'http://localhost:3000',
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'Content-Type', 'Accept', 'Authorization'],
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
}
bootstrap();
