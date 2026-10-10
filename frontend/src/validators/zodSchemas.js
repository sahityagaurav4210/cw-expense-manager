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
    .min(1, "Expense name is required")
    .max(64, "Expense name cannot exceed 64 characters")
    .regex(/^[a-zA-Z0-9\s]+$/, "Only letters and numbers are allowed"),
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
