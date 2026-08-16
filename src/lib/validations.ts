import { z } from "zod";

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password is required"),
});

export const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(200),
  description: z.string().max(2000).optional(),
});

export const updateProjectSchema = z.object({
  name: z.string().min(1, "Project name is required").max(200).optional(),
  description: z.string().max(2000).optional(),
});

export const createIncidentSchema = z.object({
  title: z.string().min(1, "Title is required").max(500),
  description: z.string().min(1, "Description is required"),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  assigneeId: z.string().uuid().optional().or(z.literal("")),
});

export const updateIncidentSchema = z.object({
  title: z.string().min(1, "Title is required").max(500).optional(),
  description: z.string().optional(),
  status: z
    .enum(["investigating", "identified", "monitoring", "resolved"])
    .optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  assigneeId: z.string().uuid().optional().or(z.literal("")),
});

export const commentSchema = z.object({
  content: z.string().min(1, "Comment cannot be empty").max(5000),
});

export const searchIncidentsSchema = z.object({
  q: z.string().optional(),
  status: z
    .enum(["investigating", "identified", "monitoring", "resolved"])
    .optional(),
  severity: z.enum(["low", "medium", "high", "critical"]).optional(),
  assigneeId: z.string().uuid().optional().or(z.literal("")),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});