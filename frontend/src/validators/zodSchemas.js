import { z } from "zod";

export const registerZodSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(32, "Name cannot exceed 32 characters")
    .regex(/^[a-zA-Z\s]+$/, "Only letters and spaces are allowed, no special characters"),
  email: z
    .string()
    .min(1, "Email is required")
    .max(32, "Email cannot exceed 32 characters")
    .email("Invalid email address format"),
  phone_no: z
    .string()
    .optional()
    .refine((val) => !val || /^[6-9]\d{9}$/.test(val), {
      message: "Only 10-digit Indian mobile numbers starting with 6-9 are allowed",
    }),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(25, "Password cannot exceed 25 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[!@#$%^&*(),.?":{}|<>]).{8,25}$/,
      "Password must contain at least 1 uppercase letter, 1 lowercase letter, and 1 special symbol"
    ),
  employment_type: z.enum(["Salaried", "Self-Employed"], {
    errorMap: () => ({ message: "Please select an employment type" }),
  }),
  captcha: z.string().min(1, "CAPTCHA text is required").max(8, "CAPTCHA text cannot exceed 8 characters"),
});

export const loginZodSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
  captcha: z.string().min(1, "CAPTCHA is required"),
});

export const categoryZodSchema = z.object({
  name: z
    .string()
    .min(1, "Category name is required")
    .max(100, "Category name cannot exceed 100 characters")
    .regex(/^[a-zA-Z0-9\s_\-\/]+$/, "Allowed special characters are dash, underscore, space, and forward slash"),
  captchaText: z.string().min(1, "CAPTCHA is required"),
});

export const budgetZodSchema = z.object({
  amount: z
    .string()
    .min(1, "Budget amount is required")
    .refine((val) => !/[eE]/.test(val) && !isNaN(Number(val)) && Number(val) > 0, {
      message: "Scientific notation is not allowed. Must be a valid positive number.",
    }),
  from_date: z.string().min(1, "From date is required"),
  to_date: z.string().min(1, "To date is required"),
  captchaText: z.string().min(1, "CAPTCHA is required"),
});

export const expenseZodSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Expense name must be at least 3 characters")
    .max(100, "Expense name cannot exceed 100 characters")
    .regex(/^[a-zA-Z0-9\s_\-\/]+$/, "Only letters, numbers, spaces, dash, underscore, and forward slash are allowed"),
  amount: z
    .string()
    .min(1, "Expense amount is required")
    .refine((val) => !/[eE]/.test(val) && !isNaN(Number(val)) && Number(val) > 0, {
      message: "Scientific notation is not allowed. Must be a valid positive number.",
    }),
  category_id: z.string().optional(),
  type: z.enum(["Fixed", "Variable"], {
    errorMap: () => ({ message: "Expense type must be Fixed or Variable" }),
  }),
  expense_date: z.string().optional(),
  captchaText: z.string().min(1, "CAPTCHA is required"),
});

export const bulkExpenseRowZodSchema = z.object({
  srNo: z
    .string()
    .optional()
    .refine((val) => !val || /^[1-9]\d*$/.test(val.trim()), {
      message: "Sr. No. must be a positive integer.",
    }),
  name: z
    .string()
    .trim()
    .min(3, "Please enter a valid expense name. It must be of at least 3 characters and can be of at most 100 characters.")
    .max(100, "Please enter a valid expense name. It must be of at least 3 characters and can be of at most 100 characters.")
    .regex(
      /^[a-zA-Z0-9\s_\-\/]+$/,
      "Expense Name can only contain letters, numbers, spaces, dash, underscore, and forward slash."
    ),
  amount: z
    .string()
    .trim()
    .min(1, "Expense Amount is required.")
    .refine(
      (val) =>
        !/[eE]/.test(val) &&
        !isNaN(Number(val)) &&
        isFinite(Number(val)) &&
        Number(val) >= 1 &&
        Number(val) <= 9999999999.99,
      {
        message: "Please enter a valid expense amount. It must be greater than or equal to 1.",
      }
    ),
  category: z.string().trim().optional().default("Others"),
  type: z
    .string()
    .trim()
    .refine((val) => ["fixed", "variable"].includes(val.toLowerCase()), {
      message: "Please select a valid expense type. It can be either Variable or Fixed.",
    }),
  expenseDate: z
    .string()
    .trim()
    .regex(
      /^(\d{4}-\d{2}-\d{2}|\d{2}-\d{2}-\d{4})$/,
      "Please enter a valid expense date in either DD-MM-YYYY or YYYY-MM-DD format."
    ),
});

export const bulkExpenseUploadZodSchema = z.object({
  captcha: z
    .string()
    .min(1, "CAPTCHA is required")
    .max(8, "CAPTCHA cannot exceed 8 characters"),
  captchaId: z.string().min(1, "CAPTCHA ID is required"),
});

export const debtZodSchema = z.object({
  type: z.enum(["LENT", "BORROWED"], {
    errorMap: () => ({ message: "Type must be Lent or Borrowed" }),
  }),
  person_name: z
    .string()
    .trim()
    .min(3, "Person name must be at least 3 characters")
    .max(100, "Person name cannot exceed 100 characters")
    .regex(
      /^[a-zA-Z0-9\s_\-\.]+$/,
      "Only letters, numbers, spaces, dots, dashes, and underscores are allowed"
    ),
  contact_info: z.string().trim().max(100, "Max 100 characters").optional(),
  initial_amount: z
    .string()
    .min(1, "Amount is required")
    .refine(
      (val) => !/[eE]/.test(val) && !isNaN(Number(val)) && Number(val) > 0,
      {
        message: "Must be a valid positive number without scientific notation",
      }
    ),
  lent_date: z.string().optional(),
  due_date: z.string().optional(),
  notes: z.string().max(255, "Notes cannot exceed 255 characters").optional(),
  captchaText: z.string().min(1, "CAPTCHA is required"),
});

export const debtSettlementZodSchema = z.object({
  amount: z
    .string()
    .min(1, "Settlement amount is required")
    .refine(
      (val) => !/[eE]/.test(val) && !isNaN(Number(val)) && Number(val) > 0,
      {
        message: "Must be a valid positive amount",
      }
    ),
  settlement_date: z.string().optional(),
  payment_mode: z.enum(["Cash", "UPI", "Bank Transfer", "Other"], {
    errorMap: () => ({ message: "Please select a valid payment mode" }),
  }),
  notes: z.string().max(255, "Notes cannot exceed 255 characters").optional(),
  captchaText: z.string().min(1, "CAPTCHA is required"),
});

export const contactZodSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name cannot exceed 100 characters")
    .regex(/^[a-zA-Z0-9\s.\-_]+$/, "Only letters, numbers, spaces, dots, dashes, and underscores are allowed"),
  phone: z
    .string()
    .trim()
    .min(7, "Phone number must be at least 7 characters")
    .max(20, "Phone number cannot exceed 20 characters"),
  email: z
    .string()
    .trim()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Please enter a valid email address",
    }),
  category: z.string().optional(),
  company: z.string().trim().max(100, "Company cannot exceed 100 characters").optional(),
  job_title: z.string().trim().max(100, "Job title cannot exceed 100 characters").optional(),
  address: z.string().trim().max(255, "Address cannot exceed 255 characters").optional(),
  notes: z.string().trim().max(255, "Notes cannot exceed 255 characters").optional(),
  is_favorite: z.boolean().optional(),
});
