import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcryptjs';

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(userData: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = this.userRepository.create({
      name: userData.name,
      email: userData.email,
      password: hashedPassword,
      role: userData.role || UserRole.EMPLOYEE,
    });
    return await this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find({
      select: [
        'id', 
        'name', 
        'email', 
        'role', 
        'annualLeaveBalance', 
        'sickLeaveBalance', 
        'personalLeaveBalance', 
        'emergencyLeaveBalance',
        'emailNotifications',
        'createdAt', 
        'updatedAt'
      ],
    });
  }

  async findOne(id: number): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id },
      select: [
        'id', 
        'name', 
        'email', 
        'role', 
        'annualLeaveBalance', 
        'sickLeaveBalance', 
        'personalLeaveBalance', 
        'emergencyLeaveBalance',
        'emailNotifications',
        'createdAt', 
        'updatedAt'
      ],
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email },
    });
  }

  async update(id: number, userData: Partial<CreateUserDto>): Promise<User | null> {
    const updateData: Partial<User> = {};
    
    if (userData.name) updateData.name = userData.name;
    if (userData.email) updateData.email = userData.email;
    if (userData.role) updateData.role = userData.role;
    if (userData.password) {
      updateData.password = await bcrypt.hash(userData.password, 10);
    }

    await this.userRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }
}
