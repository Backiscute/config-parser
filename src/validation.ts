import type { Schema as JoiSchema } from "joi";
import type { Schema as ZodSchema } from "zod";

let Joi: typeof import("joi") | null = null;
let Zod: typeof import("zod") | null = null;

try {
    Joi = require("joi");
} catch {}

try {
    Zod = require("zod");
} catch {}

export function isJoiSchema(schema): schema is JoiSchema {
    return schema[Symbol.for('@hapi/joi/schema')]
};

export function isZodSchema(schema): schema is ZodSchema {
    return !!Zod && Zod.ZodSchema.prototype.isPrototypeOf(schema);
}