// A parchment-style printable contract. Ctrl+P and the browser does the rest.
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { toGoldString } from '@bandage/shared'
import { apiFetch } from '../../api'
import { Spinner } from '../../components/ui'
import { formatDay } from '../../utils/dates'

type Contract = {
  id: number
  reference: string
  fee: number
  startDate: string
  terms: string
  signedAt: string | null
  createdAt: string
  application: { listing: { id: number; title: string; monster: { id: number; name: string } } }
}

export default function ContractPrintPage() {
  const { id } = useParams()
  const { data: contracts } = useQuery({ queryKey: ['contracts'], queryFn: () => apiFetch('/hiring/contracts') as Promise<Contract[]> })
  const c = contracts?.find((x) => x.id === Number(id))
  if (!contracts) return <Spinner />
  if (!c) return <p className="page">Contract not found.</p>

  return (
    <div className="print-page">
      <div className="no-print toolbar">
        <button onClick={() => window.print()}>🖨️ Print</button>
      </div>
      <article className="contract-parchment">
        <h1>📜 Contract of Hire</h1>
        <p className="contract-ref">Reference {c.reference}</p>
        <p>
          This agreement, drawn up at <b>Bandage Castle</b> on {formatDay(c.createdAt)}, concerns the monster known as <b>{c.application.listing.monster.name}</b>,
          hereafter "the Monster".
        </p>
        <p>
          The Overlord engages the Monster from <b>{formatDay(c.startDate)}</b> for a one-off fee of <b>{toGoldString(c.fee)}</b>, payable to Bandage Castle in gold, gems or
          (with the Castellan's written blessing) favours.
        </p>
        <h3>Terms</h3>
        <pre className="terms">{c.terms}</pre>
        <div className="signatures">
          <div>
            <div className="signature-line">{c.signedAt ? '✍️ signed' : ''}</div>
            <p>The Overlord {c.signedAt && <span className="muted">({formatDay(c.signedAt)})</span>}</p>
          </div>
          <div>
            <div className="signature-line">🩹</div>
            <p>For Bandage Castle</p>
          </div>
        </div>
        <p className="seal">🔴</p>
      </article>
    </div>
  )
}
