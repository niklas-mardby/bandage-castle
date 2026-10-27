// @ts-nocheck -- TODO(sam): the Express 4.22 types made these legacy handlers light up red (req.user.role, req.query). Clean up after launch.
import express from 'express'
import { q } from '../db'
import { checkAuth, staffOnly } from '../middleware/checkAuth'

const router = express.Router()

router.get('/occupancy', checkAuth, staffOnly, async (req, res) => {
  try {
    const byReason = await q("SELECT reason, COUNT(*) as n FROM tbl_stay WHERE status = 'CHECKED_IN' GROUP BY reason")
    const total = await q("SELECT COUNT(*) as n FROM tbl_stay WHERE status = 'CHECKED_IN'")
    const arriving = await q("SELECT COUNT(*) as n FROM tbl_stay WHERE status = 'BOOKED' AND start_date <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)")
    const leaving = await q(
      "SELECT COUNT(*) as n FROM tbl_stay WHERE status = 'CHECKED_IN' AND expected_pickup <= DATE_ADD(CURDATE(), INTERVAL 7 DAY)"
    )
    res.json({ total: total[0].n, byReason, arrivingThisWeek: arriving[0].n, leavingThisWeek: leaving[0].n })
  } catch (e) {
    res.status(500).send('oops')
  }
})

router.get('/revenue', checkAuth, staffOnly, async (req, res) => {
  const year = req.query.year || new Date().getFullYear()
  try {
    const rows = await q(
      "SELECT MONTH(issued_at) as month, SUM(total) as invoiced, COUNT(*) as invoices FROM tbl_invoice WHERE YEAR(issued_at) = ? AND status != 'VOID' GROUP BY MONTH(issued_at) ORDER BY month",
      [year]
    )
    const paid = await q(
      'SELECT MONTH(p.paid_at) as month, SUM(p.amount) as paid FROM tbl_payment p WHERE YEAR(p.paid_at) = ? GROUP BY MONTH(p.paid_at)',
      [year]
    )
    const result = rows.map((r: any) => {
      const p = paid.find((x: any) => x.month == r.month)
      return { ...r, paid: p ? p.paid : 0 }
    })
    res.json(result)
  } catch (e) {
    res.status(500).send('oops')
  }
})

router.get('/available', checkAuth, staffOnly, async (req, res) => {
  const rows = await q("SELECT id, name, species, birth_date FROM tbl_monster WHERE status = 'AVAILABLE' ORDER BY name")
  res.json(rows)
})

// export for the accountant (Grimbold)
router.get('/revenue.csv', checkAuth, async (req, res) => {
  if (req.user.role !== 'STAFF' && req.user.role !== 'ADMIN') return res.status(403).send('no')
  const rows = await q("SELECT id, customer_id, issued_at, total, status FROM tbl_invoice WHERE status != 'VOID' ORDER BY issued_at")
  let csv = 'id,customer_id,issued_at,total,status\n'
  for (const r of rows) {
    csv += [r.id, r.customer_id, r.issued_at.toISOString(), r.total, r.status].join(',') + '\n'
  }
  res.setHeader('Content-Type', 'text/csv')
  res.send(csv)
})

export default router
