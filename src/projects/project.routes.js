const router = require('express').Router()
const { body } = require('express-validator')
const ctrl = require('./project.controller')

const validateCreate = [
  body('client_id').notEmpty().withMessage('client_id is required'),
  body('name').notEmpty().withMessage('name is required')
]

router.post('/', validateCreate, ctrl.createProject)
router.get('/', ctrl.listProjects)
router.get('/:id/summary', ctrl.getProjectSummary)
router.get('/:id', ctrl.getProject)
router.put('/:id', ctrl.updateProject)
router.delete('/:id', ctrl.deleteProject)
router.get('/:id/tasks', ctrl.getProjectTasks)

module.exports = router
