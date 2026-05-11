const router = require('express').Router()
const { body } = require('express-validator')
const ctrl = require('./client.controller')

const validateCreate = [
  body('name').notEmpty().withMessage('name is required'),
  body('email').isEmail().withMessage('valid email is required')
]

router.post('/', validateCreate, ctrl.createClient)
router.get('/', ctrl.listClients)
router.get('/:id', ctrl.getClient)
router.put('/:id', ctrl.updateClient)
router.delete('/:id', ctrl.deleteClient)
router.get('/:id/projects', ctrl.getClientProjects)

module.exports = router
