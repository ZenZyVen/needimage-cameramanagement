const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticate } = require('../middlewares/authMiddleware');
const { requireRole } = require('../middlewares/roleMiddleware');

router.get('/', authenticate, projectController.getAllProjects);
router.get('/:id', authenticate, projectController.getProjectById);
router.post('/', authenticate, projectController.createProject); // all authenticated users can create production projects
router.put('/:id', authenticate, projectController.updateProject);
router.delete('/:id', authenticate, requireRole('ADMIN'), projectController.deleteProject);

// Project Crew Registration routes
router.get('/:id/crew', authenticate, projectController.getProjectCrew);
router.post('/:id/crew', authenticate, projectController.addProjectCrewMember);
router.delete('/:id/crew/:crewId', authenticate, projectController.removeProjectCrewMember);

module.exports = router;
