import type { Firestore, Query, DocumentData } from 'firebase-admin/firestore';
import { getFirestore } from '../firebase/index.js';

export abstract class BaseRepository<T extends { id?: string }> {
  protected db: Firestore;
  protected abstract collectionName: string;

  constructor() {
    this.db = getFirestore();
  }

  protected col() {
    return this.db.collection(this.collectionName);
  }

  async findById(id: string): Promise<(T & { id: string }) | null> {
    const doc = await this.col().doc(id).get();
    if (!doc.exists) return null;
    return { id: doc.id, ...doc.data() } as T & { id: string };
  }

  async create(data: Omit<T, 'id'>): Promise<string> {
    const ref = await this.col().add(data);
    return ref.id;
  }

  async createWithId(id: string, data: T): Promise<void> {
    await this.col().doc(id).set(data, { merge: true });
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    await this.col().doc(id).update(data as DocumentData);
  }

  async delete(id: string): Promise<void> {
    await this.col().doc(id).delete();
  }

  async findWhere(
    field: string,
    op: FirebaseFirestore.WhereFilterOp,
    value: unknown,
    limit = 50,
    orderBy?: { field: string; direction: 'asc' | 'desc' }
  ): Promise<Array<T & { id: string }>> {
    let query: Query = this.col().where(field, op, value);
    if (orderBy) {
      query = query.orderBy(orderBy.field, orderBy.direction);
    }
    const snapshot = await query.limit(limit).get();
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as T & { id: string });
  }

  async batchWrite(
    operations: Array<{ type: 'set' | 'update' | 'delete'; id: string; data?: Partial<T> }>
  ): Promise<void> {
    const batch = this.db.batch();
    for (const op of operations) {
      const ref = this.col().doc(op.id);
      if (op.type === 'set' && op.data) batch.set(ref, op.data, { merge: true });
      else if (op.type === 'update' && op.data) batch.update(ref, op.data as DocumentData);
      else if (op.type === 'delete') batch.delete(ref);
    }
    await batch.commit();
  }
}
