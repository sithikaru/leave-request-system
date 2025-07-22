import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublicHoliday } from './entities/public-holiday.entity';
import Holidays from 'date-holidays';

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

@Injectable()
export class PublicHolidaysService {
  private holidaysLib: any;

  constructor(
    @InjectRepository(PublicHoliday)
    private readonly publicHolidayRepository: Repository<PublicHoliday>,
  ) {
    this.holidaysLib = new Holidays();
  }

  async findAll(country?: string, year?: number): Promise<PublicHoliday[]> {
    const query = this.publicHolidayRepository.createQueryBuilder('holiday');
    
    if (country) {
      query.andWhere('holiday.country = :country', { country });
    }
    
    if (year) {
      query.andWhere('YEAR(holiday.date) = :year', { year });
    }
    
    return await query
      .andWhere('holiday.isActive = :isActive', { isActive: true })
      .orderBy('holiday.date', 'ASC')
      .getMany();
  }

  async findOne(id: number): Promise<PublicHoliday> {
    const holiday = await this.publicHolidayRepository.findOne({
      where: { id },
    });

    if (!holiday) {
      throw new NotFoundException(`Public holiday with ID ${id} not found`);
    }

    return holiday;
  }

  async create(createPublicHolidayDto: CreatePublicHolidayDto): Promise<PublicHoliday> {
    const holiday = this.publicHolidayRepository.create({
      name: createPublicHolidayDto.name,
      date: new Date(createPublicHolidayDto.date),
      description: createPublicHolidayDto.description,
      country: createPublicHolidayDto.country || 'LK',
    });

    return await this.publicHolidayRepository.save(holiday);
  }

  async update(id: number, updatePublicHolidayDto: UpdatePublicHolidayDto): Promise<PublicHoliday> {
    const holiday = await this.findOne(id);

    if (updatePublicHolidayDto.date) {
      holiday.date = new Date(updatePublicHolidayDto.date);
    }
    if (updatePublicHolidayDto.name) {
      holiday.name = updatePublicHolidayDto.name;
    }
    if (updatePublicHolidayDto.description !== undefined) {
      holiday.description = updatePublicHolidayDto.description;
    }
    if (updatePublicHolidayDto.isActive !== undefined) {
      holiday.isActive = updatePublicHolidayDto.isActive;
    }

    return await this.publicHolidayRepository.save(holiday);
  }

  async remove(id: number): Promise<void> {
    const holiday = await this.findOne(id);
    await this.publicHolidayRepository.remove(holiday);
  }

  getSupportedCountries() {
    return [
      { code: 'LK', name: 'Sri Lanka' },
      { code: 'US', name: 'United States' },
      { code: 'GB', name: 'United Kingdom' },
      { code: 'AU', name: 'Australia' },
      { code: 'CA', name: 'Canada' },
      { code: 'IN', name: 'India' },
      { code: 'DE', name: 'Germany' },
      { code: 'FR', name: 'France' },
      { code: 'JP', name: 'Japan' },
      { code: 'SG', name: 'Singapore' },
      { code: 'MY', name: 'Malaysia' },
      { code: 'TH', name: 'Thailand' },
      { code: 'NZ', name: 'New Zealand' },
      { code: 'ZA', name: 'South Africa' },
    ];
  }

  async fetchAndSaveHolidays(countryCode: string, year: number): Promise<PublicHoliday[]> {
    try {
      this.holidaysLib.init(countryCode);
      const holidaysData = this.holidaysLib.getHolidays(year);

      const savedHolidays: PublicHoliday[] = [];

      for (const holidayData of holidaysData) {
        const existingHoliday = await this.publicHolidayRepository.findOne({
          where: {
            date: new Date(holidayData.date).toISOString().split('T')[0] as any,
            country: countryCode.toUpperCase(),
          },
        });

        if (!existingHoliday) {
          const newHoliday = this.publicHolidayRepository.create({
            name: holidayData.name,
            date: new Date(holidayData.date),
            description: holidayData.type || '',
            country: countryCode.toUpperCase(),
            isActive: true,
          });

          const savedHoliday = await this.publicHolidayRepository.save(newHoliday);
          savedHolidays.push(savedHoliday);
        }
      }

      return savedHolidays;
    } catch (error) {
      throw new Error(`Failed to fetch holidays for ${countryCode}: ${error.message}`);
    }
  }

  async getHolidaysForDateRange(startDate: Date, endDate: Date, country?: string): Promise<Date[]> {
    const query = this.publicHolidayRepository.createQueryBuilder('holiday')
      .where('holiday.date >= :startDate', { startDate })
      .andWhere('holiday.date <= :endDate', { endDate })
      .andWhere('holiday.isActive = :isActive', { isActive: true });

    if (country) {
      query.andWhere('holiday.country = :country', { country });
    }

    const holidays = await query.getMany();
    return holidays.map(holiday => holiday.date);
  }
}
