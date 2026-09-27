import { Server, Socket } from 'socket.io';

export const setupSocketHandlers = (io: Server): void => {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Client connected: ${socket.id}`);

    // Join a department room for targeted updates
    socket.on('join:department', (departmentId: string) => {
      socket.join(`department:${departmentId}`);
      console.log(`[Socket] ${socket.id} joined department:${departmentId}`);
    });

    // Leave a department room
    socket.on('leave:department', (departmentId: string) => {
      socket.leave(`department:${departmentId}`);
      console.log(`[Socket] ${socket.id} left department:${departmentId}`);
    });

    // Join the display board room (for TV monitors)
    socket.on('join:display', (departmentId: string) => {
      socket.join(`display:${departmentId}`);
      console.log(`[Socket] ${socket.id} joined display:${departmentId}`);
    });

    // Join patient-specific room for tracking
    socket.on('join:patient', (patientId: string) => {
      socket.join(`patient:${patientId}`);
      console.log(`[Socket] ${socket.id} joined patient:${patientId}`);
    });

    socket.on('leave:patient', (patientId: string) => {
      socket.leave(`patient:${patientId}`);
    });

    // Ping/pong for connection health
    socket.on('ping', () => {
      socket.emit('pong', { timestamp: Date.now() });
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  // Log when the server is ready
  console.log('[Socket] Socket.IO handlers initialized');
};
