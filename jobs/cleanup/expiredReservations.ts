import { prisma } from '@/lib/db';

export async function cleanupExpiredReservations() {
  try {
    const now = new Date();
    
    const result = await prisma.reservation.deleteMany({
      where: {
        expiresAt: {
          lt: now
        }
      }
    });

    console.log(`Cleaned up ${result.count} expired reservations`);
    
    return result.count;
  } catch (error) {
    console.error('Cleanup job failed:', error);
    throw error;
  }
}
