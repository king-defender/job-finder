import { Test, TestingModule } from '@nestjs/testing';
import { JobsController } from './jobs.controller';
import { JobsService } from './jobs.service';

describe('JobsController', () => {
  let controller: JobsController;
  let service: JobsService;

  const mockJobsService = {
    createJob: jest.fn().mockResolvedValue({
      job: { id: 'j1', title: 'Developer', company: 'Acme' },
      score: { overall: 85, recommendation: 'APPLY' },
      duplicate: false,
    }),
    discoverJobs: jest.fn().mockResolvedValue([
      {
        job: { id: 'j2', title: 'Discovered Role', company: 'TechCorp' },
        score: { overall: 90, recommendation: 'APPLY' },
        duplicate: false,
      },
    ]),
    listJobsRanked: jest.fn().mockResolvedValue([]),
    getJobById: jest.fn().mockResolvedValue({ id: 'j1', title: 'Developer' }),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [JobsController],
      providers: [
        {
          provide: JobsService,
          useValue: mockJobsService,
        },
      ],
    }).compile();

    controller = module.get<JobsController>(JobsController);
    service = module.get<JobsService>(JobsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call discoverJobs on search requests', async () => {
    const result = await controller.discoverJobs({ keywords: 'Developer', remoteOnly: true });
    expect(service.discoverJobs).toHaveBeenCalledWith({
      keywords: 'Developer',
      location: undefined,
      remoteOnly: true,
      limit: 10,
    });
    expect(result).toHaveLength(1);
  });
});
