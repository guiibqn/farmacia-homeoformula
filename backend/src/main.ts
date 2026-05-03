import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilitando o CORS
  app.enableCors({
    // Em dev, permite o localhost do Vite. Em produção, você colocaria a URL da Vercel.
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // Importante se vocês forem usar cookies para o Login
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
