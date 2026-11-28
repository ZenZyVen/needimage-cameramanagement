const { prisma } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');
const { generateNextProjectSequence } = require('../utils/codeGenerator');

// 0. Get next available project sequence number & code
exports.getNextProjectCode = async (req, res, next) => {
  try {
    const sequence = await generateNextProjectSequence(prisma);
    return res.json({
      success: true,
      data: sequence
    });
  } catch (error) {
    next(error);
  }
};

// 0b. Get registered system users as crew candidates for production projects
exports.getCrewCandidates = async (req, res, next) => {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        phone: true,
        avatar: true,
        profilePhoto: true
      }
    });

    const formatted = users.map(u => ({
      ...u,
      roleNote: u.avatar && !u.avatar.startsWith('http') && !u.avatar.startsWith('/') ? u.avatar : ''
    }));

    return res.json({
      success: true,
      data: formatted
    });
  } catch (error) {
    next(error);
  }
};

// 1. Get all projects
exports.getAllProjects = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const where = {};

    if (status && status !== 'ALL') {
      where.status = status;
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { projectCode: { contains: q, mode: 'insensitive' } },
        { client: { contains: q, mode: 'insensitive' } },
        { director: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } }
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        crew: {
          orderBy: { registeredAt: 'asc' }
        },
        _count: {
          select: { borrowRequests: true, crew: true }
        }
      }
    });

    return res.json({
      success: true,
      data: projects
    });
  } catch (error) {
    next(error);
  }
};

// 2. Get single project by ID with assigned equipment & requests
exports.getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, department: true }
        },
        crew: {
          orderBy: { registeredAt: 'asc' }
        },
        borrowRequests: {
          orderBy: { createdAt: 'desc' },
          include: {
            user: { select: { id: true, name: true, email: true } },
            items: {
              include: {
                equipment: {
                  select: {
                    id: true,
                    assetTag: true,
                    name: true,
                    brand: true,
                    model: true,
                    status: true,
                    imageUrl: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    return res.json({
      success: true,
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// 3. Create project
exports.createProject = async (req, res, next) => {
  try {
    const { title, projectCode, client, director, location, startDate, endDate, status, notes, crewMembers } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Project Title, Start Date, and End Date are required.'
      });
    }

    // Auto-generate projectCode starting from lowest available sequence (01, 02, 03, ...)
    let isAutoCode = false;
    let cleanCode = projectCode ? projectCode.trim().toUpperCase() : null;
    if (!cleanCode || cleanCode.startsWith('AUTO') || cleanCode === '') {
      isAutoCode = true;
      const seq = await generateNextProjectSequence(prisma);
      cleanCode = seq.projectCode;
    } else {
      const existingCode = await prisma.project.findUnique({
        where: { projectCode: cleanCode }
      });
      if (existingCode) {
        isAutoCode = true;
        const seq = await generateNextProjectSequence(prisma);
        cleanCode = seq.projectCode;
      }
    }

    const validCrew = Array.isArray(crewMembers)
      ? crewMembers.filter(c => c && c.name && c.name.trim() && c.role && c.role.trim())
      : [];

    let project = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      const match = cleanCode.match(/(\d+)$/);
      const projNum = match ? match[1].padStart(2, '0') : '01';
      try {
        project = await prisma.project.create({
          data: {
            projectNumber: projNum,
            projectCode: cleanCode,
            title: title.trim(),
            client: client ? client.trim() : null,
            director: director ? director.trim() : null,
            location: location ? location.trim() : null,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            status: status || 'PLANNING',
            createdById: req.user.id,
            notes: notes ? notes.trim() : null,
            ...(validCrew.length > 0
              ? {
                  crew: {
                    create: validCrew.map(c => ({
                      name: c.name.trim(),
                      role: c.role.trim(),
                      phone: c.phone ? c.phone.trim() : null,
                      shootDate: c.shootDate || String(startDate).substring(0, 10),
                      callTime: c.callTime || '07:00 AM',
                      projectType: c.projectType || title.trim(),
                      status: c.status || 'CONFIRMED',
                      notes: c.notes ? c.notes.trim() : null
                    }))
                  }
                }
              : {})
          },
          include: {
            createdBy: { select: { id: true, name: true, email: true } },
            crew: true
          }
        });
        break;
      } catch (err) {
        if (err.code === 'P2002' && isAutoCode && attempt < 2) {
          const seq = await generateNextProjectSequence(prisma);
          cleanCode = seq.projectCode;
          continue;
        }
        throw err;
      }
    }

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_PROJECT',
      entity: 'Project',
      entityId: project.id,
      details: { projectCode: project.projectCode, title: project.title, crewCount: validCrew.length },
      req
    });

    return res.status(201).json({
      success: true,
      message: 'Project created successfully.',
      data: project
    });
  } catch (error) {
    next(error);
  }
};

// 4. Update project
exports.updateProject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, client, director, location, startDate, endDate, status, notes, crewMembers } = req.body;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    if (Array.isArray(crewMembers)) {
      const validCrew = crewMembers.filter(c => c && c.name && c.name.trim() && c.role && c.role.trim());
      await prisma.projectCrew.deleteMany({ where: { projectId: id } }).catch(() => {});
      for (const c of validCrew) {
        await prisma.projectCrew.create({
          data: {
            projectId: id,
            name: c.name.trim(),
            role: c.role.trim(),
            phone: c.phone ? c.phone.trim() : null,
            shootDate: c.shootDate || (startDate ? String(startDate).substring(0, 10) : new Date().toISOString().substring(0, 10)),
            callTime: c.callTime || '07:00 AM',
            projectType: c.projectType || (title ? title.trim() : existing.title),
            status: c.status || 'CONFIRMED',
            notes: c.notes ? c.notes.trim() : null
          }
        }).catch(() => {});
      }
    }

    const updated = await prisma.project.update({
      where: { id },
      data: {
        title: title ? title.trim() : undefined,
        client: client !== undefined ? (client ? client.trim() : null) : undefined,
        director: director !== undefined ? (director ? director.trim() : null) : undefined,
        location: location !== undefined ? (location ? location.trim() : null) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status: status || undefined,
        notes: notes !== undefined ? (notes ? notes.trim() : null) : undefined
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } },
        crew: { orderBy: { registeredAt: 'asc' } }
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE_PROJECT',
      entity: 'Project',
      entityId: id,
      details: { projectCode: updated.projectCode, title: updated.title },
      req
    });

    return res.json({
      success: true,
      message: 'Project updated successfully.',
      data: updated
    });
  } catch (error) {
    next(error);
  }
};

// 5. Delete project (Admin full control: safely unlinks borrow requests & invoices)
exports.deleteProject = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        _count: { select: { borrowRequests: true } }
      }
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    await prisma.$transaction(async (tx) => {
      if (tx.borrowRequest?.updateMany) {
        await tx.borrowRequest.updateMany({
          where: { projectId: id },
          data: { projectId: null }
        });
      }
      if (tx.invoice?.updateMany) {
        await tx.invoice.updateMany({
          where: { projectId: id },
          data: { projectId: null }
        });
      }
      if (tx.projectCrew?.deleteMany) {
        await tx.projectCrew.deleteMany({
          where: { projectId: id }
        });
      }
      await tx.project.delete({ where: { id } });
    }, {
      maxWait: 10000,
      timeout: 30000
    });

    await logAudit({
      userId: req.user.id,
      action: 'DELETE_PROJECT',
      entity: 'Project',
      entityId: id,
      details: {
        projectCode: project.projectCode,
        title: project.title,
        unlinkedRequests: project._count?.borrowRequests || 0
      },
      req
    });

    return res.json({
      success: true,
      message: 'Project deleted successfully.'
    });
  } catch (error) {
    next(error);
  }
};

// Helper to parse notes & crew from a project
const parseProjectCrewAndNotes = (notes) => {
  if (!notes) return { general: '', crew: [] };
  try {
    const parsed = JSON.parse(notes);
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.crew)) {
      return { general: parsed.general || '', crew: parsed.crew };
    }
  } catch (e) {
    // Plain text notes fallback
  }
  return { general: notes, crew: [] };
};

// 6. Get crew roster for project
exports.getProjectCrew = async (req, res, next) => {
  try {
    const { id } = req.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: { crew: { orderBy: { registeredAt: 'asc' } } }
    });

    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    let crew = project.crew || [];
    const { general, crew: notesCrew } = parseProjectCrewAndNotes(project.notes);
    if (crew.length === 0 && notesCrew.length > 0) {
      crew = notesCrew;
    }

    return res.json({
      success: true,
      projectTitle: project.title,
      projectCode: project.projectCode,
      data: crew,
      generalNotes: general
    });
  } catch (error) {
    next(error);
  }
};

// 7. Add crew member to project
exports.addProjectCrewMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, role, shootDate, projectType, phone, callTime, notes, status } = req.body;

    if (!name || !role) {
      return res.status(400).json({ success: false, message: 'Crew member name and role are required.' });
    }

    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    const newMember = await prisma.projectCrew.create({
      data: {
        projectId: id,
        name: name.trim(),
        role: role.trim(),
        shootDate: shootDate ? shootDate.trim() : new Date().toISOString().substring(0, 10),
        projectType: projectType ? projectType.trim() : (project.title || 'Production Shoot'),
        phone: phone ? phone.trim() : null,
        callTime: callTime ? callTime.trim() : null,
        notes: notes ? notes.trim() : null,
        status: status || 'CONFIRMED'
      }
    });

    // Also sync to notes JSON for dual compatibility
    const parsed = parseProjectCrewAndNotes(project.notes);
    parsed.crew.push(newMember);
    await prisma.project.update({
      where: { id },
      data: { notes: JSON.stringify(parsed) }
    }).catch(() => {});

    return res.status(201).json({
      success: true,
      message: `Crew member "${newMember.name}" registered for shoot.`,
      data: newMember
    });
  } catch (error) {
    next(error);
  }
};

// 8. Remove crew member from project
exports.removeProjectCrewMember = async (req, res, next) => {
  try {
    const { id, crewId } = req.params;
    const project = await prisma.project.findUnique({ where: { id } });
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
    }

    await prisma.projectCrew.deleteMany({
      where: {
        id: crewId,
        projectId: id
      }
    }).catch(() => {});

    // Also update notes JSON
    const parsed = parseProjectCrewAndNotes(project.notes);
    parsed.crew = parsed.crew.filter(c => c.id !== crewId);
    await prisma.project.update({
      where: { id },
      data: { notes: JSON.stringify(parsed) }
    }).catch(() => {});

    return res.json({
      success: true,
      message: 'Crew member removed from project.'
    });
  } catch (error) {
    next(error);
  }
};
