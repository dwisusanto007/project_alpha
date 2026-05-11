const router = require('express').Router()
const { body } = require('express-validator')
const ctrl = require('./timesheet.controller')

const validateStart = [
  body('project_id').notEmpty().withMessage('project_id is required')
]

const validateManual = [
  body('project_id').notEmpty().withMessage('project_id is required'),
  body('started_at').notEmpty().withMessage('started_at is required'),
  body('duration_min').isInt({ min: 1 }).withMessage('duration_min must be a positive integer')
]

router.get('/running', ctrl.getRunning)
router.get('/summary/project/:projectId', ctrl.getProjectSummary)
router.post('/start', validateStart, ctrl.startTimer)
router.post('/manual', validateManual, ctrl.createManual)
router.post('/:id/stop', ctrl.stopTimer)
router.get('/', ctrl.listEntries)
router.put('/:id', ctrl.updateEntry)
router.delete('/:id', ctrl.deleteEntry)

module.exports = router
