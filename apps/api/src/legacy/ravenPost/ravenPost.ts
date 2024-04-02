// Raven Post - sends messages to customers.
// DEPRECATED (2024): use NotificationService in modules/notifications instead. See ADR-007.
// ravens are "sent" by the flush loop. for now it just logs.
import { query, q } from '../db'

/** @deprecated Use NotificationService.notifyCustomer() instead (ADR-007). */
export function sendRaven(customerId: any, subject: string, body: string, cb?: any) {
  query('INSERT INTO tbl_raven (customer_id, subject, body) VALUES (?,?,?)', [customerId, subject, body], (err: any, result: any) => {
    if (err) {
      console.log('raven failed to take off', err.message)
      if (cb) cb(err)
      return
    }
    if (cb) cb(null, result.insertId)
  })
}

let started = false

export function startRavenLoop() {
  if (started) return
  started = true
  setInterval(async () => {
    try {
      const ravens = await q("SELECT r.*, c.email, c.contact_pref FROM tbl_raven r JOIN tbl_customer c ON c.id = r.customer_id WHERE r.status = 'QUEUED' LIMIT 20")
      for (const r of ravens) {
        console.log('[raven] -> ' + r.email + ' (' + r.contact_pref + '): ' + r.subject)
        await q("UPDATE tbl_raven SET status = 'SENT', sent_at = NOW() WHERE id = ?", [r.id])
      }
    } catch (e) {
      // db not up yet probably
    }
  }, 15000)
}
