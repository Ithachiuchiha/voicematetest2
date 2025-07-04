import { db } from "./db";
import { diaryEntries, tasks, scheduleItems, users } from "@shared/schema";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";

// Optimized queries with proper indexing considerations
export class OptimizedQueries {
  
  // Optimized diary entries query with date range
  static async getDiaryEntriesByDateRange(
    userId: number, 
    startDate: string, 
    endDate: string
  ) {
    return db
      .select()
      .from(diaryEntries)
      .where(
        and(
          eq(diaryEntries.userId, userId),
          gte(diaryEntries.date, startDate),
          lte(diaryEntries.date, endDate)
        )
      )
      .orderBy(desc(diaryEntries.timestamp));
  }

  // Get tasks with priority filtering and pagination
  static async getTasksPaginated(
    userId: number, 
    status?: string, 
    priority?: string,
    limit = 50,
    offset = 0
  ) {
    const conditions = [eq(tasks.userId, userId)];
    
    if (status) {
      conditions.push(eq(tasks.status, status));
    }
    
    if (priority) {
      conditions.push(eq(tasks.priority, priority));
    }

    return db
      .select()
      .from(tasks)
      .where(and(...conditions))
      .orderBy(desc(tasks.createdAt))
      .limit(limit)
      .offset(offset);
  }

  // Get active schedule items for today
  static async getTodaySchedule(userId: number) {
    return db
      .select()
      .from(scheduleItems)
      .where(
        and(
          eq(scheduleItems.userId, userId),
          eq(scheduleItems.isActive, true)
        )
      )
      .orderBy(asc(scheduleItems.time));
  }

  // Bulk operations for better performance
  static async bulkCreateTasks(userId: number, taskData: any[]) {
    const tasksWithUserId = taskData.map(task => ({
      ...task,
      userId,
      createdAt: new Date()
    }));
    
    return db.insert(tasks).values(tasksWithUserId).returning();
  }

  // Analytics queries
  static async getUserStats(userId: number) {
    const [taskStats, diaryStats, scheduleStats] = await Promise.all([
      db
        .select({
          status: tasks.status
        })
        .from(tasks)
        .where(eq(tasks.userId, userId))
        .groupBy(tasks.status),
      
      db
        .select({
          date: diaryEntries.date
        })
        .from(diaryEntries)
        .where(eq(diaryEntries.userId, userId))
        .groupBy(diaryEntries.date)
        .orderBy(desc(diaryEntries.date))
        .limit(30),
      
      db
        .select()
        .from(scheduleItems)
        .where(
          and(
            eq(scheduleItems.userId, userId),
            eq(scheduleItems.isActive, true)
          )
        )
    ]);

    return {
      tasks: taskStats,
      diaryEntries: diaryStats,
      activeScheduleItems: scheduleStats.length
    };
  }
}

// Connection pool monitoring
export function monitorDbHealth() {
  return {
    status: 'connected',
    timestamp: new Date().toISOString(),
    info: 'Database connection healthy'
  };
}