import Joi from "joi";

export const registerSchema = Joi.object({
  name: Joi.string()
    .max(32)
    .pattern(/^[a-zA-Z\s]+$/)
    .required()
    .messages({
      "string.pattern.base":
        "Name must contain only letters and spaces without special characters.",
    }),
  email: Joi.string().email().max(32).required(),
  phone_no: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .allow("", null)
    .messages({
      "string.pattern.base":
        "Only valid 10-digit Indian phone numbers starting with 6-9 are allowed.",
    }),
  password: Joi.string()
    .min(8)
    .max(25)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,25}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must be 8-25 characters long, contain at least one uppercase letter, one lowercase letter, and one special character.",
    }),
  employment_type: Joi.string().valid("Salaried", "Self-Employed").required(),
  captcha: Joi.string().max(8).required(),
  captchaId: Joi.number().allow("", null).optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().max(32).required(),
  password: Joi.string().required(),
  captcha: Joi.string().required(),
  captchaId: Joi.number().required(),
});

export const categorySchema = Joi.object({
  name: Joi.string()
    .max(100)
    .pattern(/^[a-zA-Z0-9\s_\-\/]+$/)
    .required()
    .messages({
      "string.pattern.base":
        "Category name can only contain letters, numbers, spaces, dash, underscore, and forward slash.",
    }),
  active_flag: Joi.boolean().default(true),
  delete_flag: Joi.boolean().default(false),
  captchaText: Joi.string().required(),
  captchaId: Joi.number().allow("", null).optional(),
});

export const budgetSchema = Joi.object({
  amount: Joi.number().positive().invalid(NaN).required(),
  from_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  to_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .required(),
  captchaText: Joi.string().required(),
  captchaId: Joi.number().allow("", null).optional(),
});

export const expenseSchema = Joi.object({
  name: Joi.string()
    .max(64)
    .pattern(/^[a-zA-Z0-9\s]+$/)
    .required()
    .messages({
      "string.pattern.base":
        "Expense name can contain only letters and numbers.",
    }),
  amount: Joi.number().positive().invalid(NaN).required(),
  category_id: Joi.number().integer().allow(null, ""),
  type: Joi.string().valid("Fixed", "Variable").required(),
  expense_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .allow("", null),
  captchaText: Joi.string().required(),
  captchaId: Joi.number().allow("", null).optional(),
});

export const updateProfileSchema = Joi.object({
  name: Joi.string()
    .max(32)
    .pattern(/^[a-zA-Z\s]+$/)
    .messages({
      "string.pattern.base":
        "Name must contain only letters and spaces without special characters.",
    }),
  phone_no: Joi.string()
    .pattern(/^[6-9]\d{9}$/)
    .allow("", null)
    .messages({
      "string.pattern.base":
        "Only valid 10-digit Indian phone numbers starting with 6-9 are allowed.",
    }),
  employment_type: Joi.string().valid("Salaried", "Self-Employed"),
  captchaText: Joi.string().required(),
  captchaId: Joi.number().allow("", null).optional(),
}).unknown(true);
