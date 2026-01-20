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
  return reply.status(statusCode).send(response);
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
