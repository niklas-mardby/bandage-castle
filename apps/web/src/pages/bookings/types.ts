export type BookingRequest = {
  id: number
  customerId: number
  monsterId: number
  monsterName: string
  customerName: string
  reason: string
  startDate: string
  endDate: string
  message: string | null
  status: 'PENDING' | 'APPROVED' | 'DECLINED' | 'CANCELLED'
  declineNote: string | null
  stayId: number | null
  createdAt: string
}
