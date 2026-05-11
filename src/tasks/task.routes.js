const router = require('express').Router()
const { body } = require('express-validator')
const ctrl = require('./task.controller')

const validateCreate = [
  body('project_id').notEmpty().withMessage('project_id is required'),
  body('title').notEmpty().withMessage('title is required')
]

router.post('/', validateCreate, ctrl.createTask)
router.get('/', ctrl.listTasks)
router.get('/:id', ctrl.getTask)
router.put('/:id', ctrl.updateTask)
router.delete('/:id', ctrl.deleteTask)

module.exports = router
