import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Put,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CandidateProfile } from '@job-agent/shared';
import { ProfileService } from './profile.service';
import type { UpdateProfileDto } from './dto/update-profile.dto';

const UPLOAD_DIR = join(process.cwd(), 'uploads', 'resumes');

@Controller('profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  getProfile(): Promise<CandidateProfile> {
    return this.profileService.getProfile();
  }

  @Put()
  updateProfile(@Body() patch: UpdateProfileDto): Promise<CandidateProfile> {
    return this.profileService.updateProfile(patch);
  }

  @Post('resume')
  @UseInterceptors(FileInterceptor('resume'))
  async uploadResume(
    @UploadedFile() file?: Express.Multer.File,
  ): Promise<CandidateProfile> {
    if (!file) {
      throw new BadRequestException('No file uploaded under field "resume".');
    }
    if (file.mimetype !== 'application/pdf') {
      throw new BadRequestException('Only PDF resumes are supported in Phase 1.');
    }

    await mkdir(UPLOAD_DIR, { recursive: true });
    const storagePath = join(UPLOAD_DIR, `${Date.now()}-${file.originalname}`);
    await writeFile(storagePath, file.buffer);

    return this.profileService.uploadResume(file.buffer, file.originalname, storagePath);
  }
}
