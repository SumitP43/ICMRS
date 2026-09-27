import { db } from './index.ts';
import { users } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, name?: string) {
  try {
    const result = await db.insert(users)
      .values({
        uid,
        email,
        name: name || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(name ? { name } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error("User registration/retrieval failed:", error);
    throw new Error("Database operation failed for user.", { cause: error });
  }
}

export async function getUsers() {
  try {
    const results = await db.select().from(users);
    return Array.isArray(results) ? results : [];
  } catch (error) {
    console.warn("Cloud SQL not connected or query failed for users — returning empty list:", (error as any)?.message);
    return [];
  }
}
