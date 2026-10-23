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
  annual_income: Joi.alternatives()
    .try(
      Joi.number().min(0).max(999999999999.99),
      Joi.string().allow("", null).regex(/^\d+(\.\d{1,2})?$/)
    )
    .allow("", null)
    .optional(),
  captcha: Joi.string().max(8).required(),
  captchaId: Joi.number().allow("", null).optional(),
  isTermsAccepted: Joi.boolean()
    .truthy("true", "1", 1)
    .falsy("false", "0", 0)
    .valid(true)
    .required()
    .messages({
      "any.only": "You must agree to the Terms & Conditions to register.",
      "any.required": "You must agree to the Terms & Conditions to register.",
      "boolean.base": "You must agree to the Terms & Conditions to register.",
    }),
  is_terms_accepted: Joi.boolean()
    .truthy("true", "1", 1)
    .falsy("false", "0", 0)
    .valid(true)
    .optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().max(32).required(),
  password: Joi.string().required(),
  captcha: Joi.string().required(),
  captchaId: Joi.number().required(),
});

export const verifyOtpSchema = Joi.object({
  tempToken: Joi.string().required().messages({
    "string.empty": "Temporary verification token is required.",
    "any.required": "Temporary verification token is required.",
  }),
  otp: Joi.string().trim().length(6).required().messages({
    "string.empty": "OTP is required.",
    "string.length": "OTP must be exactly 6 digits.",
    "any.required": "OTP is required.",
  }),
});

export const resendOtpSchema = Joi.object({
  tempToken: Joi.string().required().messages({
    "string.empty": "Temporary verification token is required.",
    "any.required": "Temporary verification token is required.",
  }),
  captchaText: Joi.string().allow("", null).optional(),
  captcha: Joi.string().allow("", null).optional(),
  captchaId: Joi.alternatives().try(Joi.number(), Joi.string()).allow("", null).optional(),
}).unknown(true);

export const forgotPasswordSendOtpSchema = Joi.object({
  email: Joi.string().email().max(32).required().messages({
    "string.email": "Please enter a valid email address.",
    "string.empty": "Email is required.",
    "any.required": "Email is required.",
  }),
  captcha: Joi.string().allow("", null).optional(),
  captchaId: Joi.alternatives().try(Joi.number(), Joi.string()).allow("", null).optional(),
}).unknown(true);

export const forgotPasswordVerifyOtpSchema = Joi.object({
  resetToken: Joi.string().required().messages({
    "string.empty": "Reset token is required.",
    "any.required": "Reset token is required.",
  }),
  otp: Joi.string().trim().length(6).required().messages({
    "string.empty": "OTP is required.",
    "string.length": "OTP must be exactly 6 digits.",
    "any.required": "OTP is required.",
  }),
});

export const forgotPasswordResendOtpSchema = Joi.object({
  resetToken: Joi.string().required().messages({
    "string.empty": "Reset token is required.",
    "any.required": "Reset token is required.",
  }),
  captchaText: Joi.string().allow("", null).optional(),
  captcha: Joi.string().allow("", null).optional(),
  captchaId: Joi.alternatives().try(Joi.number(), Joi.string()).allow("", null).optional(),
}).unknown(true);

export const forgotPasswordResetSchema = Joi.object({
  resetToken: Joi.string().required().messages({
    "string.empty": "Reset token is required.",
    "any.required": "Reset token is required.",
  }),
  password: Joi.string()
    .min(8)
    .max(25)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,25}$/)
    .required()
    .messages({
      "string.pattern.base":
        "Password must be 8-25 characters long, contain at least one uppercase letter, one lowercase letter, and one special character.",
      "string.empty": "Password is required.",
      "any.required": "Password is required.",
    }),
  confirmPassword: Joi.string().required().valid(Joi.ref("password")).messages({
    "any.only": "Passwords do not match.",
    "string.empty": "Confirm Password is required.",
    "any.required": "Confirm Password is required.",
  }),
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
    .trim()
    .min(3)
    .max(100)
    .pattern(/^[a-zA-Z0-9\s_\-\/]+$/)
    .required()
    .messages({
      "string.empty": "Expense name is required.",
      "string.min":
        "Please enter a valid expense name. It must be of at least 3 characters and can be of at most 100 characters.",
      "string.max":
        "Please enter a valid expense name. It must be of at least 3 characters and can be of at most 100 characters.",
      "string.pattern.base":
        "Expense name can contain only letters, numbers, spaces, dash, underscore, and forward slash.",
    }),
  amount: Joi.number().positive().invalid(NaN).required(),
  category_id: Joi.alternatives().try(Joi.number().integer(), Joi.string().allow("", null)).optional(),
  type: Joi.string().valid("Fixed", "Variable").required(),
  expense_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .allow("", null),
  captchaText: Joi.string().required(),
  captchaId: Joi.alternatives().try(Joi.number(), Joi.string()).allow("", null).optional(),
}).unknown(true);

export const bulkExpenseRequestSchema = Joi.object({
  captcha: Joi.string().max(8).optional(),
  captchaText: Joi.string().max(8).optional(),
  captchaId: Joi.alternatives().try(Joi.number(), Joi.string()).required().messages({
    "any.required": "CAPTCHA ID (captchaId) is required.",
    "string.empty": "CAPTCHA ID (captchaId) is required.",
  }),
})
  .or("captcha", "captchaText")
  .messages({
    "object.missing": "CAPTCHA verification code (captcha) is required.",
  })
  .unknown(true);

export const bulkExpenseRowSchema = Joi.object({
  srNo: Joi.string()
    .allow("", null)
    .pattern(/^[1-9]\d*$/)
    .messages({
      "string.pattern.base": "Sr. No. must be a positive integer.",
    }),
  name: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .pattern(/^[a-zA-Z0-9\s_\-\/]+$/)
    .required()
    .messages({
      "string.empty": "Expense Name is required.",
      "string.min":
        "Please enter a valid expense name. It must be of at least 3 characters and can be of at most 100 characters.",
      "string.max":
        "Please enter a valid expense name. It must be of at least 3 characters and can be of at most 100 characters.",
      "string.pattern.base":
        "Expense Name can only contain letters, numbers, spaces, dash, underscore, and forward slash.",
    }),
  amount: Joi.number()
    .min(1)
    .max(9999999999.99)
    .invalid(NaN)
    .required()
    .messages({
      "number.base": "Please enter a valid expense amount. It must be greater than or equal to 1.",
      "number.min": "Please enter a valid expense amount. It must be greater than or equal to 1.",
      "number.max": "Expense amount exceeds maximum allowed limit.",
      "any.required": "Expense Amount is required.",
    }),
  category: Joi.string().trim().allow("", null).default("Others"),
  type: Joi.string()
    .trim()
    .valid("Fixed", "Variable", "fixed", "variable")
    .required()
    .messages({
      "any.only": "Please select a valid expense type. It can be either Variable or Fixed.",
      "string.empty": "Expense Type is required. It can be either Variable or Fixed.",
    }),
  expenseDate: Joi.string()
    .trim()
    .pattern(/^(\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4})$/)
    .required()
    .messages({
      "string.empty": "Expense Date is required.",
      "string.pattern.base":
        "Please enter a valid expense date in either DD-MM-YYYY or YYYY-MM-DD format.",
    }),
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
  annual_income: Joi.alternatives()
    .try(
      Joi.number().min(0).max(999999999999.99),
      Joi.string().allow("", null).regex(/^\d+(\.\d{1,2})?$/)
    )
    .allow("", null)
    .optional(),
  captchaText: Joi.string().required(),
  captchaId: Joi.number().allow("", null).optional(),
}).unknown(true);

export const debtSchema = Joi.object({
  type: Joi.string().valid("LENT", "BORROWED").default("LENT"),
  person_name: Joi.string()
    .trim()
    .min(3)
    .max(100)
    .pattern(/^[a-zA-Z0-9\s_\-\.]+$/)
    .required()
    .messages({
      "string.empty": "Person name is required.",
      "string.min": "Person name must be at least 3 characters.",
      "string.max": "Person name cannot exceed 100 characters.",
      "string.pattern.base":
        "Person name can only contain letters, numbers, spaces, dots, dashes, and underscores.",
    }),
  contact_info: Joi.string().trim().max(100).allow("", null).optional(),
  initial_amount: Joi.number().positive().invalid(NaN).required().messages({
    "number.base": "Valid amount greater than 0 is required.",
    "number.positive": "Amount must be greater than 0.",
    "any.required": "Amount is required.",
  }),
  lent_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .allow("", null)
    .optional(),
  due_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .allow("", null)
    .optional(),
  notes: Joi.string().trim().max(255).allow("", null).optional(),
  captchaText: Joi.string().required(),
  captchaId: Joi.alternatives().try(Joi.number(), Joi.string()).allow("", null).optional(),
}).unknown(true);

export const debtSettlementSchema = Joi.object({
  amount: Joi.number().positive().invalid(NaN).required().messages({
    "number.base": "Valid settlement amount greater than 0 is required.",
    "number.positive": "Settlement amount must be greater than 0.",
    "any.required": "Settlement amount is required.",
  }),
  settlement_date: Joi.string()
    .pattern(/^\d{4}-\d{2}-\d{2}$/)
    .allow("", null)
    .optional(),
  payment_mode: Joi.string()
    .valid("Cash", "UPI", "Bank Transfer", "Other")
    .default("UPI"),
  notes: Joi.string().trim().max(255).allow("", null).optional(),
  captchaText: Joi.string().required(),
  captchaId: Joi.alternatives().try(Joi.number(), Joi.string()).allow("", null).optional(),
}).unknown(true);

export const contactSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-Z0-9\s.\-_]+$/)
    .required()
    .messages({
      "string.empty": "Contact name is required.",
      "string.min": "Contact name must be at least 2 characters.",
      "string.max": "Contact name cannot exceed 100 characters.",
      "string.pattern.base":
        "Contact name can only contain letters, numbers, spaces, dots, dashes, and underscores.",
    }),
  phone: Joi.string()
    .trim()
    .min(7)
    .max(20)
    .required()
    .messages({
      "string.empty": "Phone number is required.",
      "string.min": "Phone number must be at least 7 characters.",
      "string.max": "Phone number cannot exceed 20 characters.",
    }),
  email: Joi.string().trim().email().allow("", null).optional().messages({
    "string.email": "Please enter a valid email address.",
  }),
  category: Joi.string()
    .valid("Friend", "Family", "Colleague", "Business", "Vendor", "Client", "Other")
    .default("Other")
    .allow("", null)
    .optional(),
  company: Joi.string().trim().max(100).allow("", null).optional(),
  job_title: Joi.string().trim().max(100).allow("", null).optional(),
  address: Joi.string().trim().max(255).allow("", null).optional(),
  notes: Joi.string().trim().max(255).allow("", null).optional(),
  is_favorite: Joi.alternatives().try(Joi.boolean(), Joi.string()).optional(),
  captchaText: Joi.string().optional(),
  captchaId: Joi.alternatives().try(Joi.number(), Joi.string()).allow("", null).optional(),
}).unknown(true);
