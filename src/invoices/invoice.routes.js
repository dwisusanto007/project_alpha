const router = require('express').Router()
const ctrl = require('./invoice.controller')

router.post('/from-project/:projectId', ctrl.createFromProject)
router.get('/', ctrl.listInvoices)
router.get('/:id', ctrl.getInvoice)
router.patch('/:id/status', ctrl.patchStatus)
router.post('/:id/send', ctrl.sendInvoice)

module.exports = router
