const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

// Read routes: All authenticated users (Admin, Stock Controller, Normal Users) can view projects
router.get('/', authenticate, projectController.getAllProjects);
router.get('/next-code', authenticate, projectController.getNextProjectCode);
router.get('/crew-candidates', authenticate, projectController.getCrewCandidates);
router.get('/:id', authenticate, projectController.getProjectById);
router.get('/:id/crew', authenticate, projectController.getProjectCrew);

// Write routes: Strictly restricted to ADMIN. Normal users must NOT be able to create, edit, or delete projects.
router.post('/', authenticate, requireRole('ADMIN'), projectController.createProject);
router.put('/:id', authenticate, requireRole('ADMIN'), projectController.updateProject);
router.delete('/:id', authenticate, requireRole('ADMIN'), projectController.deleteProject);

// Project Crew Registration write routes: Admin only
router.post('/:id/crew', authenticate, requireRole('ADMIN'), projectController.addProjectCrewMember);
router.delete('/:id/crew/:crewId', authenticate, requireRole('ADMIN'), projectController.removeProjectCrewMember);

module.exports = router;
