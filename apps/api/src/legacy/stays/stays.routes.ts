// @ts-nocheck -- TODO(sam): the Express 4.22 types made these legacy handlers light up red (req.user.role, req.query). Clean up after launch.
import express from 'express'
import { query, q } from '../db'
import { checkAuth, staffOnly } from '../middleware/checkAuth'
import { createInvoiceForStay } from '../billing/billing'
import { sendRaven } from '../ravenPost/ravenPost'

const router = express.Router()

function notifyOwner(stayId: any, what: string) {
  query('SELECT s.customer_id, m.name FROM tbl_stay s JOIN tbl_monster m ON m.id = s.monster_id WHERE s.id = ?', [stayId], (err: any, rows: any) => {
    if (err || !rows[0]) return
    sendRaven(rows[0].customer_id, rows[0].name + ' ' + what, 'Greetings from Bandage Castle! ' + rows[0].name + ' ' + what)
  })
}

const STAY_SELECT =
  'SELECT s.*, m.name as monster_name, m.species, c.title, c.first_name, c.last_name FROM tbl_stay s JOIN tbl_monster m ON m.id = s.monster_id JOIN tbl_customer c ON c.id = s.customer_id'

router.get('/', checkAuth, (req, res) => {
  let sql = STAY_SELECT
  const where: string[] = []
  const params: any[] = []
  if (req.query.status) {
    where.push('s.status = ?')
    params.push(req.query.status)
  }
  if (req.query.monster_id) {
    where.push('s.monster_id = ?')
    params.push(req.query.monster_id)
  }
  if (where.length) sql += ' WHERE ' + where.join(' AND ')
  sql += ' ORDER BY s.start_date DESC'
  query(sql, params, (err: any, rows: any) => {
    if (err) return res.status(500).send('oops')
    res.json(rows)
  })
})

router.get('/:id', checkAuth, (req, res) => {
  query(STAY_SELECT + ' WHERE s.id = ?', [req.params.id], (err: any, rows: any) => {
    if (err) return res.status(500).send('oops')
    if (!rows[0]) return res.status(404).json({ error: 'not found' })
    res.json(rows[0])
  })
})

router.post('/', checkAuth, staffOnly, async (req, res) => {
  const s = req.body
  if (!s.monster_id || !s.customer_id || !s.reason) return res.status(400).json({ error: 'missing fields' })
  try {
    const existing = await q("SELECT id FROM tbl_stay WHERE monster_id = ? AND status IN ('BOOKED','CHECKED_IN')", [s.monster_id])
    if (existing.length) return res.status(400).json({ error: 'monster already has a stay' })
    const result = await q(
      'INSERT INTO tbl_stay (monster_id, customer_id, reason, start_date, expected_pickup, daily_rate, notes) VALUES (?,?,?,?,?,?,?)',
      [s.monster_id, s.customer_id, s.reason, s.start_date, s.expected_pickup, parseFloat(s.daily_rate) || 10, s.notes || null]
    )
    res.json({ id: result.insertId })
  } catch (e) {
    console.log(e)
    res.status(500).send('oops')
  }
})

router.post('/:id/checkin', checkAuth, staffOnly, (req, res) => {
  query("UPDATE tbl_stay SET status = 'CHECKED_IN', checked_in_at = NOW() WHERE id = ? AND status = 'BOOKED'", [req.params.id], (err: any, result: any) => {
    if (err) return res.status(500).send('oops')
    if (!result.affectedRows) return res.status(400).json({ error: 'cant check in' })
    notifyOwner(req.params.id, 'has arrived safely at Bandage Castle')
    query(
      "UPDATE tbl_monster SET status = 'IN_RESIDENCE' WHERE id = (SELECT monster_id FROM tbl_stay WHERE id = ?)",
      [req.params.id],
      () => res.json({ ok: true })
    )
  })
})

router.post('/:id/checkout', checkAuth, staffOnly, (req, res) => {
  query("UPDATE tbl_stay SET status = 'CHECKED_OUT', checked_out_at = NOW() WHERE id = ? AND status = 'CHECKED_IN'", [req.params.id], (err: any, result: any) => {
    if (err) return res.status(500).send('oops')
    if (!result.affectedRows) return res.status(400).json({ error: 'cant check out' })
    notifyOwner(req.params.id, 'has been checked out. Safe travels!')
    query(
      "UPDATE tbl_monster SET status = 'HOME' WHERE id = (SELECT monster_id FROM tbl_stay WHERE id = ?)",
      [req.params.id],
      () => {
        createInvoiceForStay(req.params.id)
          .then((invoiceId) => res.json({ ok: true, invoice_id: invoiceId }))
          .catch((e) => {
            console.log('invoice failed', e)
            res.json({ ok: true })
          })
      }
    )
  })
})

router.post('/:id/cancel', checkAuth, staffOnly, (req, res) => {
  query("UPDATE tbl_stay SET status = 'CANCELLED' WHERE id = ? AND status = 'BOOKED'", [req.params.id], (err: any) => {
    if (err) return res.status(500).send('oops')
    res.json({ ok: true })
  })
})

export default router
