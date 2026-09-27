import prisma from '../config/database';

export const createAuditLog = async (
  userId: string | null,
  action: string,
  entity: string,
  entityId?: string,
  details?: string,
  ipAddress?: string
): Promise<void> => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entity,
        entityId,
        details,
        ipAddress,
      },
    });
  } catch (error) {
    // Don't let audit failures break the main flow
    console.error('Audit log error:', error);
  }
};
