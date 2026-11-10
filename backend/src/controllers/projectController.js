const { prisma } = require('../config/db');
const { logAudit } = require('../utils/auditLogger');

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
        _count: {
          select: { borrowRequests: true }
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
    const { title, projectCode, client, director, location, startDate, endDate, status, notes } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Project Title, Start Date, and End Date are required.'
      });
    }

    // Auto-generate projectCode if not supplied
    let cleanCode = projectCode ? projectCode.trim().toUpperCase() : null;
    if (!cleanCode) {
      const count = await prisma.project.count();
      const year = new Date().getFullYear();
      cleanCode = `PRJ-${year}-${String(count + 1).padStart(3, '0')}`;
    }

    const existingCode = await prisma.project.findUnique({
      where: { projectCode: cleanCode }
    });

    if (existingCode) {
      return res.status(409).json({
        success: false,
        message: `Project Code "${cleanCode}" is already in use.`
      });
    }

    const project = await prisma.project.create({
      data: {
        projectCode: cleanCode,
        title: title.trim(),
        client: client ? client.trim() : null,
        director: director ? director.trim() : null,
        location: location ? location.trim() : null,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status: status || 'PLANNING',
        createdById: req.user.id,
        notes: notes ? notes.trim() : null
      },
      include: {
        createdBy: { select: { id: true, name: true, email: true } }
      }
    });

    await logAudit({
      userId: req.user.id,
      action: 'CREATE_PROJECT',
      entity: 'Project',
      entityId: project.id,
      details: { projectCode: project.projectCode, title: project.title },
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
    const { title, client, director, location, startDate, endDate, status, notes } = req.body;

    const existing = await prisma.project.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Project not found.' });
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

// 5. Delete project
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

    if (project._count.borrowRequests > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete project that has associated borrow requests. Change status to CANCELLED instead.'
      });
    }

    await prisma.project.delete({ where: { id } });

    await logAudit({
      userId: req.user.id,
      action: 'DELETE_PROJECT',
      entity: 'Project',
      entityId: id,
      details: { projectCode: project.projectCode, title: project.title },
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
