import { BaseRepository, PaginationResult } from '../database/repositories/BaseRepository';
import { Document, ClientSession, FilterQuery, UpdateQuery, QueryOptions } from 'mongoose';
import { ApiError } from '../utils/ApiError';

export class BaseService<T extends Document, R extends BaseRepository<T>> {
  protected repository: R;

  constructor(repository: R) {
    this.repository = repository;
  }

  async create(data: Partial<T>, session?: ClientSession): Promise<T> {
    return this.repository.create(data, session);
  }

  async update(id: string, updateData: UpdateQuery<T>, session?: ClientSession): Promise<T> {
    const updated = await this.repository.update(id, updateData, session);
    if (!updated) throw new ApiError(404, 'Entity not found');
    return updated;
  }

  async delete(id: string, hard: boolean = false, session?: ClientSession): Promise<T> {
    const deleted = await this.repository.delete(id, hard, session);
    if (!deleted) throw new ApiError(404, 'Entity not found');
    return deleted;
  }

  async restore(id: string, session?: ClientSession): Promise<T> {
    const restored = await this.repository.restore(id, session);
    if (!restored) throw new ApiError(404, 'Entity not found');
    return restored;
  }

  async getById(id: string, options?: QueryOptions): Promise<T> {
    const entity = await this.repository.findById(id, options);
    if (!entity) throw new ApiError(404, 'Entity not found');
    return entity;
  }

  async getAll(filter: FilterQuery<T> = {}, options?: QueryOptions): Promise<T[]> {
    return this.repository.findMany(filter, options);
  }

  async paginate(filter: FilterQuery<T>, page: number = 1, limit: number = 10, options?: QueryOptions): Promise<PaginationResult<T>> {
    return this.repository.paginate(filter, page, limit, options);
  }
}
