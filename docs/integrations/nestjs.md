# NestJS Integration Guide

## Overview

NestJS is a progressive Node.js framework for building efficient, scalable server-side applications. ColdRunners will migrate from Express to NestJS in Phase 3 for better architecture, dependency injection, and enterprise features.

**Official Documentation:** https://docs.nestjs.com  
**GitHub:** https://github.com/nestjs/nest  
**Website:** https://nestjs.com

## Features

- TypeScript-first
- Modular architecture
- Dependency injection
- Decorators for routing, validation, etc.
- Built-in support for microservices
- WebSocket, GraphQL, WebSockets
- Testing utilities
- CLI for scaffolding

## Migration from Express

### Current Express Structure

```typescript
// server.ts (Express)
import express from 'express';

const app = express();

app.get('/api/leads', (req, res) => {
  const leads = database.getAllLeads();
  res.json({ leads });
});

app.post('/api/agents/run-search', async (req, res) => {
  const result = await workflowEngine.startWorkflow(req.body);
  res.json(result);
});
```

### NestJS Structure

```typescript
// src/leads/leads.controller.ts
import { Controller, Get, Post, Body } from '@nestjs/common';
import { LeadsService } from './leads.service';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  async getAllLeads() {
    return { leads: await this.leadsService.findAll() };
  }

  @Post('search')
  async runSearch(@Body() criteria: SearchCriteriaDto) {
    return await this.leadsService.search(criteria);
  }
}
```

## Project Structure

```
src/
├── main.ts                          # Application entry point
├── app.module.ts                    # Root module
├── app.controller.ts                # Root controller
├── app.service.ts                   # Root service
│
├── agents/                          # Agent module
│   ├── agents.module.ts
│   ├── agents.controller.ts
│   ├── agents.service.ts
│   └── dto/
│       └── search-criteria.dto.ts
│
├── leads/                           # Leads module
│   ├── leads.module.ts
│   ├── leads.controller.ts
│   ├── leads.service.ts
│   └── entities/
│       └── lead.entity.ts
│
├── plugins/                         # Plugin module
│   ├── plugins.module.ts
│   ├── plugins.service.ts
│   └── implementations/
│       ├── google-places.plugin.ts
│       ├── firecrawl.plugin.ts
│       └── hunter.plugin.ts
│
├── mcp/                             # MCP module
│   ├── mcp.module.ts
│   ├── mcp.gateway.ts
│   └── tools/
│       ├── discover-businesses.tool.ts
│       └── analyze-website.tool.ts
│
└── common/                          # Shared utilities
    ├── decorators/
    ├── guards/
    ├── interceptors/
    └── filters/
```

## Setup

### Installation

```bash
# Install NestJS CLI
npm install -g @nestjs/cli

# Create new project
nest new coldrunners-api

# Or add to existing project
npm install @nestjs/core @nestjs/common @nestjs/platform-express reflect-metadata rxjs
```

### Main Entry Point

```typescript
// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Security
  app.use(helmet());
  app.use(compression());

  // CORS
  app.enableCors({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix('api');

  // Validation
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger (API documentation)
  const config = new DocumentBuilder()
    .setTitle('ColdRunners API')
    .setDescription('Business Intelligence Platform API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
}

bootstrap();
```

### Root Module

```typescript
// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgentsModule } from './agents/agents.module';
import { LeadsModule } from './leads/leads.module';
import { PluginsModule } from './plugins/plugins.module';
import { McpModule } from './mcp/mcp.module';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Database
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432', 10),
      username: process.env.DB_USER || 'coldrunners',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'coldrunners',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV === 'development',
    }),

    // Feature modules
    AgentsModule,
    LeadsModule,
    PluginsModule,
    McpModule,
  ],
})
export class AppModule {}
```

## Controllers

### Leads Controller

```typescript
// src/leads/leads.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { SearchLeadsDto } from './dto/search-leads.dto';

@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get()
  async findAll(@Query() query: SearchLeadsDto) {
    return { leads: await this.leadsService.findAll(query) };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.leadsService.findOne(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateLeadDto) {
    return await this.leadsService.create(dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateLeadDto) {
    return await this.leadsService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    await this.leadsService.remove(id);
  }
}
```

## Services

### Leads Service

```typescript
// src/leads/leads.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { SearchLeadsDto } from './dto/search-leads.dto';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
  ) {}

  async findAll(query?: SearchLeadsDto): Promise<Lead[]> {
    const qb = this.leadRepository.createQueryBuilder('lead');

    if (query?.grade) {
      qb.andWhere('lead.grade = :grade', { grade: query.grade });
    }

    if (query?.city) {
      qb.andWhere('lead.city = :city', { city: query.city });
    }

    if (query?.minScore) {
      qb.andWhere('lead.opportunityScore >= :minScore', { minScore: query.minScore });
    }

    qb.orderBy('lead.opportunityScore', 'DESC');

    return await qb.getMany();
  }

  async findOne(id: string): Promise<Lead> {
    const lead = await this.leadRepository.findOne({
      where: { id },
      relations: ['audit', 'socials', 'hrContact'],
    });

    if (!lead) {
      throw new NotFoundException(`Lead ${id} not found`);
    }

    return lead;
  }

  async create(dto: CreateLeadDto): Promise<Lead> {
    const lead = this.leadRepository.create(dto);
    return await this.leadRepository.save(lead);
  }

  async update(id: string, dto: UpdateLeadDto): Promise<Lead> {
    const lead = await this.findOne(id);
    Object.assign(lead, dto);
    return await this.leadRepository.save(lead);
  }

  async remove(id: string): Promise<void> {
    const result = await this.leadRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`Lead ${id} not found`);
    }
  }
}
```

## DTOs (Data Transfer Objects)

```typescript
// src/leads/dto/search-leads.dto.ts
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class SearchLeadsDto {
  @IsOptional()
  @IsString()
  grade?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  minScore?: number;
}
```

## Entities

```typescript
// src/leads/entities/lead.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { WebsiteAudit } from './website-audit.entity';

@Entity()
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  category: string;

  @Column()
  city: string;

  @Column()
  province: string;

  @Column()
  country: string;

  @Column('float')
  rating: number;

  @Column()
  reviewCount: number;

  @Column()
  opportunityScore: number;

  @Column()
  grade: string;

  @Column({ default: 'New' })
  status: string;

  @Column()
  website: string;

  @Column()
  websiteStatus: string;

  @OneToOne(() => WebsiteAudit, { cascade: true, eager: true })
  @JoinColumn()
  audit: WebsiteAudit;
}
```

## Guards

### Authentication Guard

```typescript
// src/common/guards/auth.guard.ts
import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const token = this.extractTokenFromHeader(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync(token, {
        secret: process.env.JWT_SECRET,
      });
      request.user = payload;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}
```

## Interceptors

### Logging Interceptor

```typescript
// src/common/interceptors/logging.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const url = request.url;
    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const responseTime = Date.now() - now;
        console.log(`${method} ${url} - ${responseTime}ms`);
      }),
    );
  }
}
```

## Exception Filters

```typescript
// src/common/filters/all-exceptions.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const message = exception instanceof Error
      ? exception.message
      : 'Internal server error';

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error: message,
    });
  }
}
```

## Testing

```typescript
// src/leads/leads.controller.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';

describe('LeadsController', () => {
  let controller: LeadsController;
  let service: LeadsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeadsController],
      providers: [
        {
          provide: LeadsService,
          useValue: {
            findAll: jest.fn().mockResolvedValue([]),
            findOne: jest.fn().mockResolvedValue({ id: '1', name: 'Test' }),
          },
        },
      ],
    }).compile();

    controller = module.get<LeadsController>(LeadsController);
    service = module.get<LeadsService>(LeadsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of leads', async () => {
      const result = await controller.findAll({});
      expect(result).toEqual({ leads: [] });
    });
  });
});
```

## Resources

- **Official Docs:** https://docs.nestjs.com
- **GitHub:** https://github.com/nestjs/nest
- **CLI Documentation:** https://docs.nestjs.com/cli/overview
- **Recipes:** https://docs.nestjs.com/recipes
- **Microservices:** https://docs.nestjs.com/microservices/basics
