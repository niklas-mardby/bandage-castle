// @ts-nocheck -- TODO(sam): the Express 4.22 types made these legacy handlers light up red (req.user.role, req.query). Clean up after launch.
import express from 'express'
import { query } from '../db'
import { checkAuth, staffOnly } from '../middleware/checkAuth'
import { ageInYears } from '../lib/dates'
import { placeholderSvg } from './placeholder'

const router = express.Router()

router.get('/', checkAuth, (req, res) => {
  let sql = 'SELECT * FROM tbl_monster'
  if (req.query.mine) {
    sql += ' WHERE owner_id IN (SELECT id FROM tbl_customer WHERE user_id = ' + Number(req.user.id) + ')'
  } else if (req.user.role === 'OWNER') {
    return res.status(403).json({ error: 'owners can only list their own monsters' })
  } else if (req.query.search) {
    sql += " WHERE name LIKE '%" + req.query.search + "%' OR species LIKE '%" + req.query.search + "%'"
  }
  sql += ' ORDER BY name'

  // paged version for the list page. other places still want the plain array
  if (req.query.page) {
    const page = parseInt(req.query.page) || 1
    const size = parseInt(req.query.size) || 25
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as n').replace(' ORDER BY name', '')
    query(countSql, (err: any, countRows: any) => {
      if (err) return res.status(500).send('oops')
      query(sql + ' LIMIT ' + size + ' OFFSET ' + (page - 1) * size, (err2: any, rows: any) => {
        if (err2) return res.status(500).send('oops')
        res.json({ rows, total: countRows[0].n, page, size })
      })
    })
    return
  }

  query(sql, (err: any, rows: any) => {
    if (err) return res.status(500).send('oops')
    res.json(rows)
  })
})

// no auth, img tags cant send the token
router.get('/:id/photo', (req, res) => {
  query('SELECT name, species, photo_url FROM tbl_monster WHERE id = ?', [req.params.id], (err: any, rows: any) => {
    if (err || !rows[0]) return res.status(404).send('no')
    if (rows[0].photo_url) return res.redirect(rows[0].photo_url)
    res.setHeader('Content-Type', 'image/svg+xml')
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.send(placeholderSvg(rows[0].name, rows[0].species))
  })
})

router.get('/:id', checkAuth, (req, res) => {
  query('SELECT * FROM tbl_monster WHERE id = ?', [req.params.id], (err: any, rows: any) => {
    if (err) return res.status(500).send('oops')
    if (!rows[0]) return res.status(404).json({ error: 'no such monster' })
    const m = rows[0]
    m.age = ageInYears(m.birth_date)
    res.json(m)
  })
})

router.post('/', checkAuth, staffOnly, (req, res) => {
  const m = req.body
  query(
    'INSERT INTO tbl_monster (name, species, owner_id, birth_date, temperament, quirks, history, status) VALUES (?,?,?,?,?,?,?,?)',
    [m.name, m.species, m.owner_id, m.birth_date, m.temperament, m.quirks, m.history, m.status || 'IN_RESIDENCE'],
    (err: any, result: any) => {
      if (err) return res.status(500).send('oops')
      res.json({ id: result.insertId })
    }
  )
})

router.put('/:id', checkAuth, staffOnly, (req, res) => {
  const m = req.body
  query(
    'UPDATE tbl_monster SET name=?, species=?, owner_id=?, birth_date=?, temperament=?, quirks=?, history=?, status=? WHERE id=?',
    [m.name, m.species, m.owner_id, m.birth_date, m.temperament, m.quirks, m.history, m.status, req.params.id],
    (err: any) => {
      if (err) return res.status(500).send('oops')
      res.json({ ok: true })
    }
  )
})

router.delete('/:id', checkAuth, staffOnly, (req, res) => {
  query('DELETE FROM tbl_monster WHERE id = ?', [req.params.id], (err: any) => {
    if (err) return res.status(500).send('oops')
    res.json({ ok: true })
  })
})

export default router
