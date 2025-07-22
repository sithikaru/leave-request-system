import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PublicHolidaysService } from './public-holidays.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

export interface CreatePublicHolidayDto {
  name: string;
  date: string;
  description?: string;
  country?: string;
}

export interface UpdatePublicHolidayDto {
  name?: string;
  date?: string;
  description?: string;
  isActive?: boolean;
}

@Controller('public-holidays')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PublicHolidaysController {
  constructor(private readonly publicHolidaysService: PublicHolidaysService) {}

  @Get()
  findAll(@Query('country') country?: string, @Query('year') year?: number) {
    return this.publicHolidaysService.findAll(country, year);
  }

  @Get('countries')
  getSupportedCountries() {
    return this.publicHolidaysService.getSupportedCountries();
  }

  @Get('fetch/:country/:year')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  fetchHolidaysFromAPI(
    @Param('country') country: string,
    @Param('year') year: number
  ) {
    return this.publicHolidaysService.fetchAndSaveHolidays(country, year);
  }

  @Post()
  @Roles(UserRole.ADMIN)
  create(@Body() createPublicHolidayDto: CreatePublicHolidayDto) {
    return this.publicHolidaysService.create(createPublicHolidayDto);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.publicHolidaysService.findOne(+id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id') id: string, @Body() updatePublicHolidayDto: UpdatePublicHolidayDto) {
    return this.publicHolidaysService.update(+id, updatePublicHolidayDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string) {
    return this.publicHolidaysService.remove(+id);
  }
}
