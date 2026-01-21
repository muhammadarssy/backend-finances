import { FastifyReply } from "fastify";

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  code?: string;
}

export function sendSuccess<T>(
  reply: FastifyReply,
  data: T,
  message: string = "OK",
  statusCode: number = 200
): FastifyReply {
  const response: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  
  // Force JSON serialization to handle Prisma types
  const jsonString = JSON.stringify(response);
  
  return reply
    .status(statusCode)
    .header('Content-Type', 'application/json')
    .send(jsonString);
}

export function sendError(
  reply: FastifyReply,
  message: string,
  statusCode: number = 500,
  code?: string
): FastifyReply {
  const response: ApiResponse = {
    success: false,
    message,
    code,
  };
  return reply.status(statusCode).send(response);
}
