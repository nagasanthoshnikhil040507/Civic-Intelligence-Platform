import { Model, Document, FilterQuery, UpdateQuery, QueryOptions, PipelineStage, ClientSession } from 'mongoose';

export interface PaginationResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class BaseRepository<T extends Document> {
  protected model: Model<T>;

  constructor(model: Model<T>) {
    this.model = model;
  }

  async create(data: Partial<T>, session?: ClientSession): Promise<T> {
    const docs = await this.model.create([data], { session });
    return docs[0];
  }

  async findById(id: string, options: QueryOptions = {}): Promise<T | null> {
    const query = this.model.findById(id, null, options);
    if (options.lean) query.lean();
    return query.exec() as Promise<T | null>;
  }

  async findOne(filter: FilterQuery<T>, options: QueryOptions = {}): Promise<T | null> {
    const query = this.model.findOne(filter, null, options);
    if (options.lean) query.lean();
    return query.exec() as Promise<T | null>;
  }

  async findMany(filter: FilterQuery<T> = {}, options: QueryOptions = {}): Promise<T[]> {
    const query = this.model.find(filter, null, options);
    if (options.lean) query.lean();
    return query.exec() as Promise<T[]>;
  }

  async update(id: string, updateData: UpdateQuery<T>, session?: ClientSession): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, updateData, { new: true, session }).exec();
  }

  async updateMany(filter: FilterQuery<T>, updateData: UpdateQuery<T>, session?: ClientSession) {
    return this.model.updateMany(filter, updateData, { session }).exec();
  }

  async delete(id: string, hard: boolean = false, session?: ClientSession): Promise<T | null> {
    if (hard) {
      return this.model.findByIdAndDelete(id, { session }).exec();
    }
    // Assumes model has isDeleted property.
    return this.model.findByIdAndUpdate(id, { $set: { isDeleted: true } } as any, { new: true, session }).exec();
  }

  async restore(id: string, session?: ClientSession): Promise<T | null> {
    return this.model.findByIdAndUpdate(id, { $set: { isDeleted: false } } as any, { new: true, session }).exec();
  }

  async exists(filter: FilterQuery<T>): Promise<boolean> {
    const count = await this.model.countDocuments(filter).exec();
    return count > 0;
  }

  async count(filter: FilterQuery<T> = {}): Promise<number> {
    return this.model.countDocuments(filter).exec();
  }

  async paginate(
    filter: FilterQuery<T>,
    page: number = 1,
    limit: number = 10,
    options: QueryOptions = {}
  ): Promise<PaginationResult<T>> {
    const skip = (page - 1) * limit;
    
    // Run count and find in parallel for optimization
    const [total, data] = await Promise.all([
      this.model.countDocuments(filter).exec(),
      this.model.find(filter, null, { ...options, skip, limit }).exec()
    ]);

    return {
      data: data as T[],
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  async aggregate(pipeline: PipelineStage[]): Promise<any[]> {
    return this.model.aggregate(pipeline).exec();
  }
}
