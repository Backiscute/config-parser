import type { Schema as JoiSchema } from "joi";

let Joi: typeof import("joi") | null = null;
let Zod: typeof import("zod") | null = null;

try {
  Joi = require("joi");
} catch (e) {}

try {
  Zod = require("zod");
} catch (e) {}

export function isJoiSchema(schema: any): schema is JoiSchema {
    if (!Joi) return false;
    return Joi.isSchema(schema);
}

export function isZodSchema(schema: any): schema is Zod.Schema {
    if (!Zod) return false;
    return schema instanceof Zod.Schema;
}