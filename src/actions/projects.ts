"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/db";
import {
  projects,
  projectMembers,
  incidents,
  comments,
  timelineEvents,
} from "@/db/schema";
import { eq, and, or, ilike, desc, asc, count, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getSession } from "@/lib/auth";
import {
  createProjectSchema,
  updateProjectSchema,
  createIncidentSchema,
  updateIncidentSchema,
  commentSchema,
  searchIncidentsSchema,
} from "@/lib/validations";
import { redirect } from "next/navigation";

// --- Projects ---

export async function createProjectAction(
  prevState: unknown,
  formData: FormData
) {
  const user = await getSession();
  if (!user) redirect("/login");

  const result = createProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { name, description } = result.data;

  const [project] = await db
    .insert(projects)
    .values({ name, description: description ?? "", ownerId: user.id })
    .returning();

  // Add creator as owner
  await db.insert(projectMembers).values({
    projectId: project.id,
    userId: user.id,
    role: "owner",
  });

  revalidatePath(`/projects/${project.id}`);
  redirect(`/projects/${project.id}`);
}

export async function updateProjectAction(
  projectId: string,
  prevState: unknown,
  formData: FormData
) {
  const user = await getSession();
  if (!user) redirect("/login");

  const result = updateProjectSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description"),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  await db
    .update(projects)
    .set({
      ...result.data,
      updatedAt: new Date(),
    })
    .where(eq(projects.id, projectId));

  revalidatePath(`/projects/${projectId}`);
}

export async function deleteProjectAction(projectId: string) {
  const user = await getSession();
  if (!user) redirect("/login");

  await db.delete(projects).where(eq(projects.id, projectId));
  revalidatePath("/");
  redirect("/");
}

export async function getProjects() {
  const user = await getSession();
  if (!user) return [];

  const members = await db
    .select({
      project: projects,
      memberRole: projectMembers.role,
    })
    .from(projectMembers)
    .innerJoin(projects, eq(projectMembers.projectId, projects.id))
    .where(eq(projectMembers.userId, user.id))
    .orderBy(desc(projects.createdAt));

  return members;
}

export async function getProjectWithMembers(projectId: string) {
  const user = await getSession();
  if (!user) return null;

  const [project] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));

  if (!project) return null;

  const members = await db
    .select({
      id: projectMembers.id,
      userId: projectMembers.userId,
      role: projectMembers.role,
      userName: projects.name, // Will be joined below
    })
    .from(projectMembers)
    .where(eq(projectMembers.projectId, projectId));

  return { project, members };
}

// --- Incidents ---

export async function createIncidentAction(
  projectId: string,
  prevState: unknown,
  formData: FormData
) {
  const user = await getSession();
  if (!user) redirect("/login");

  const result = createIncidentSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    severity: formData.get("severity"),
    assigneeId: formData.get("assigneeId"),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { title, description, severity, assigneeId } = result.data;

  const [incident] = await db
    .insert(incidents)
    .values({
      projectId,
      title,
      description,
      severity: severity ?? "medium",
      assigneeId: assigneeId || null,
      createdBy: user.id,
    })
    .returning();

  // Create timeline event
  await db.insert(timelineEvents).values({
    incidentId: incident.id,
    type: "created",
    data: JSON.stringify({ createdBy: user.id, title }),
  });

  revalidatePath(`/projects/${projectId}`);
  redirect(`/projects/${projectId}/incidents/${incident.id}`);
}

export async function updateIncidentAction(
  incidentId: string,
  prevState: unknown,
  formData: FormData
) {
  const user = await getSession();
  if (!user) redirect("/login");

  const result = updateIncidentSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    status: formData.get("status"),
    severity: formData.get("severity"),
    assigneeId: formData.get("assigneeId"),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  const { title, description, status, severity, assigneeId } = result.data;

  // Get current incident for timeline tracking
  const [current] = await db
    .select()
    .from(incidents)
    .where(eq(incidents.id, incidentId));

  if (!current) return { error: "Incident not found" };

  const updates: Record<string, unknown> = { updatedAt: new Date() };

  if (title !== undefined) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (status !== undefined) {
    updates.status = status;
    if (status === "resolved") {
      updates.resolvedAt = new Date();
    }
    await db.insert(timelineEvents).values({
      incidentId,
      type: "status_changed",
      data: JSON.stringify({
        from: current.status,
        to: status,
        userId: user.id,
      }),
    });
  }
  if (severity !== undefined && severity !== current.severity) {
    updates.severity = severity;
    await db.insert(timelineEvents).values({
      incidentId,
      type: "severity_changed",
      data: JSON.stringify({
        from: current.severity,
        to: severity,
        userId: user.id,
      }),
    });
  }
  if (assigneeId !== undefined) {
    updates.assigneeId = assigneeId || null;
    if (assigneeId && current.assigneeId !== assigneeId) {
      await db.insert(timelineEvents).values({
        incidentId,
        type: "assigned",
        data: JSON.stringify({
          from: current.assigneeId,
          to: assigneeId,
          userId: user.id,
        }),
      });
    } else if (!assigneeId && current.assigneeId) {
      await db.insert(timelineEvents).values({
        incidentId,
        type: "unassigned",
        data: JSON.stringify({ userId: user.id }),
      });
    }
  }

  await db.update(incidents).set(updates).where(eq(incidents.id, incidentId));

  revalidatePath(`/projects/*/incidents/${incidentId}`);
}

export async function addCommentAction(
  incidentId: string,
  prevState: unknown,
  formData: FormData
) {
  const user = await getSession();
  if (!user) redirect("/login");

  const result = commentSchema.safeParse({
    content: formData.get("content"),
  });

  if (!result.success) {
    return { error: result.error.issues[0].message };
  }

  await db.insert(comments).values({
    incidentId,
    userId: user.id,
    content: result.data.content,
  });

  // Add timeline event
  await db.insert(timelineEvents).values({
    incidentId,
    type: "comment_added",
    data: JSON.stringify({ userId: user.id }),
  });

  revalidatePath(`/projects/*/incidents/${incidentId}`);
}

export async function getIncident(incidentId: string) {
  return getIncidentWithDetails(incidentId);
}

export async function getIncidentWithDetails(incidentId: string) {
  const [incident] = await db
    .select({
      id: incidents.id,
      title: incidents.title,
      description: incidents.description,
      status: incidents.status,
      severity: incidents.severity,
      projectId: incidents.projectId,
      createdAt: incidents.createdAt,
      updatedAt: incidents.updatedAt,
      resolvedAt: incidents.resolvedAt,
      createdBy: incidents.createdBy,
      assigneeId: incidents.assigneeId,
    })
    .from(incidents)
    .where(eq(incidents.id, incidentId));

  if (!incident) return null;

  const commentsList = await db
    .select({
      id: comments.id,
      content: comments.content,
      createdAt: comments.createdAt,
      userId: comments.userId,
      userName: users.name,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.incidentId, incidentId))
    .orderBy(asc(comments.createdAt));

  const timeline = await db
    .select()
    .from(timelineEvents)
    .where(eq(timelineEvents.incidentId, incidentId))
    .orderBy(asc(timelineEvents.createdAt));

  const [creator] = await db
    .select({ name: users.name })
    .from(users)
    .where(eq(users.id, incident.createdBy));

  const [assignee] = incident.assigneeId
    ? await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, incident.assigneeId))
    : [null];

  return {
    ...incident,
    creatorName: creator?.name,
    assigneeName: assignee?.name,
    comments: commentsList,
    timeline,
  };
}

export async function searchIncidents(
  projectId: string,
  params: {
    q?: string;
    status?: string;
    severity?: string;
    assigneeId?: string;
    page?: number;
    limit?: number;
  }
) {
  const result = searchIncidentsSchema.safeParse({
    q: params.q,
    status: params.status,
    severity: params.severity,
    assigneeId: params.assigneeId,
    page: params.page,
    limit: params.limit,
  });

  if (!result.success) {
    return { incidents: [], total: 0, page: 1, limit: 20 };
  }

  const { q, status, severity, assigneeId, page, limit } = result.data;

  const offset = (page - 1) * limit;

  const conditions = [eq(incidents.projectId, projectId)];

  if (q) {
    conditions.push(
      or(
        ilike(incidents.title, `%${q}%`),
        ilike(incidents.description, `%${q}%`)
      )
    );
  }
  if (status) conditions.push(eq(incidents.status, status));
  if (severity) conditions.push(eq(incidents.severity, severity));
  if (assigneeId) conditions.push(eq(incidents.assigneeId, assigneeId));

  const whereClause = and(...conditions);

  // Get total count
  const [{ total }] = await db
    .select({ total: count() })
    .from(incidents)
    .where(whereClause);

  // Get incidents with proper table aliases for double join
  const usersAsCreator = alias(users, "creator");
  const usersAsAssignee = alias(users, "assignee");

  const incidentsList = await db
    .select({
      id: incidents.id,
      title: incidents.title,
      description: incidents.description,
      status: incidents.status,
      severity: incidents.severity,
      createdAt: incidents.createdAt,
      updatedAt: incidents.updatedAt,
      createdBy: incidents.createdBy,
      assigneeId: incidents.assigneeId,
      creatorName: usersAsCreator.name,
      assigneeName: usersAsAssignee.name,
    })
    .from(incidents)
    .leftJoin(usersAsCreator, eq(incidents.createdBy, usersAsCreator.id))
    .leftJoin(usersAsAssignee, eq(incidents.assigneeId, usersAsAssignee.id))
    .where(whereClause)
    .orderBy(desc(incidents.createdAt))
    .limit(limit)
    .offset(offset);

  return {
    incidents: incidentsList,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function getDashboardStats(projectId: string) {
  const user = await getSession();
  if (!user) return null;

  // Total incidents
  const [{ total }] = await db
    .select({ total: count() })
    .from(incidents)
    .where(eq(incidents.projectId, projectId));

  // By status
  const byStatus = await db
    .select({
      status: incidents.status,
      count: count(),
    })
    .from(incidents)
    .where(eq(incidents.projectId, projectId))
    .groupBy(incidents.status);

  // By severity
  const bySeverity = await db
    .select({
      severity: incidents.severity,
      count: count(),
    })
    .from(incidents)
    .where(eq(incidents.projectId, projectId))
    .groupBy(incidents.severity);

  // Recent incidents with proper alias
  const usersAsCreator = alias(users, "recent_creator");
  const recent = await db
    .select({
      id: incidents.id,
      title: incidents.title,
      status: incidents.status,
      severity: incidents.severity,
      createdAt: incidents.createdAt,
      creatorName: usersAsCreator.name,
    })
    .from(incidents)
    .leftJoin(usersAsCreator, eq(incidents.createdBy, usersAsCreator.id))
    .where(eq(incidents.projectId, projectId))
    .orderBy(desc(incidents.createdAt))
    .limit(10);

  return {
    total,
    byStatus,
    bySeverity,
    recent,
  };
}

export async function getProjectMembers(projectId: string) {
  const members = await db
    .select({
      id: projectMembers.id,
      userId: projectMembers.userId,
      role: projectMembers.role,
      name: users.name,
      email: users.email,
    })
    .from(projectMembers)
    .innerJoin(users, eq(projectMembers.userId, users.id))
    .where(eq(projectMembers.projectId, projectId));

  return members;
}