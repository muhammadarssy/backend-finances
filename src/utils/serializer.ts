import { Decimal } from "@prisma/client/runtime/library";

/**
 * Convert Prisma Decimal fields to numbers for JSON serialization
 */
export function serializeDecimal(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }

  // Handle Decimal instances
  if (obj instanceof Decimal) {
    return parseFloat(obj.toString());
  }

  // Handle Date instances
  if (obj instanceof Date) {
    return obj.toISOString();
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => serializeDecimal(item));
  }

  // Handle objects
  if (typeof obj === "object") {
    const result: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        result[key] = serializeDecimal(obj[key]);
      }
    }
    return result;
  }

  // Handle BigInt
  if (typeof obj === "bigint") {
    return obj.toString();
  }

  return obj;
}
