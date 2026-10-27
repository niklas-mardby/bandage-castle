// @ts-nocheck -- TODO(sam): the Express 4.22 types made these legacy handlers light up red (req.user.role, req.query). Clean up after launch.
import express from 'express'
import { query, q } from '../db'
import { checkAuth, staffOnly } from '../middleware/checkAuth'
import { createInvoiceForStay } from './billing'
import { billingV2Enabled, legacyShapedInvoice } from './v2bridge'

const router = express.Router()

router.get('/invoices', checkAuth, (req, res) => {
  let sql =
    'SELECT i.*, c.first_name, c.last_name, c.title FROM tbl_invoice i JOIN tbl_customer c ON c.id = i.customer_id'
  const params: any[] = []
  if (req.query.mine || req.user.role === 'OWNER') {
    sql += ' WHERE c.user_id = ?'
    params.push(req.user.id)
  } else if (req.query.customer_id) {
    sql += ' WHERE i.customer_id = ?'
    params.push(req.query.customer_id)
  }
  sql += ' ORDER BY i.issued_at DESC'
  query(sql, params, (err: any, rows: any) => {
    if (err) return res.status(500).send('oops')
    res.json(rows)
  })
})

router.get('/invoices/:id', checkAuth, async (req, res) => {
  // Billing v2 preview
  if (billingV2Enabled()) {
    try {
      return res.json(await legacyShapedInvoice(Number(req.params.id)))
    } catch (e) {
      console.log('v2 bridge failed, falling back to v1', e)
    }
  }
  try {
    const rows = await q(
      'SELECT i.*, c.first_name, c.last_name, c.title, c.lair_address FROM tbl_invoice i JOIN tbl_customer c ON c.id = i.customer_id WHERE i.id = ?',
      [req.params.id]
    )
    if (!rows[0]) return res.status(404).json({ error: 'not found' })
    const invoice = rows[0]
    invoice.lines = await q('SELECT * FROM tbl_invoice_line WHERE invoice_id = ?', [req.params.id])
    invoice.payments = await q('SELECT * FROM tbl_payment WHERE invoice_id = ?', [req.params.id])
    res.json(invoice)
  } catch (e) {
    res.status(500).send('oops')
  }
})

router.post('/invoices/stay/:stayId', checkAuth, staffOnly, async (req, res) => {
  try {
    const id = await createInvoiceForStay(req.params.stayId)
    res.json({ id })
  } catch (e: any) {
    res.status(500).json({ error: e.message })
  }
})

router.post('/invoices/:id/payments', checkAuth, staffOnly, async (req, res) => {
  const amount = parseFloat(req.body.amount)
  if (!amount) return res.status(400).json({ error: 'amount?' })
  await q('INSERT INTO tbl_payment (invoice_id, amount, method) VALUES (?,?,?)', [req.params.id, amount, req.body.method || 'GOLD'])
  const inv = (await q('SELECT total FROM tbl_invoice WHERE id = ?', [req.params.id]))[0]
  const paid = (await q('SELECT SUM(amount) as paid FROM tbl_payment WHERE invoice_id = ?', [req.params.id]))[0].paid
  if (paid >= inv.total) await q("UPDATE tbl_invoice SET status = 'PAID' WHERE id = ?", [req.params.id])
  res.json({ ok: true })
})

router.post('/invoices/:id/void', checkAuth, staffOnly, (req, res) => {
  query("UPDATE tbl_invoice SET status = 'VOID' WHERE id = ?", [req.params.id], (err: any) => {
    if (err) return res.status(500).send('oops')
    res.json({ ok: true })
  })
})

export default router
