export type UserRole = 'client' | 'photographer' | 'admin'
export type MediaType = 'photo' | 'video'
export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'completed'
export type UsageType = 'editorial' | 'commercial' | 'social_media' | 'print' | 'custom'
export type PartnerTier = 'bronze' | 'silver' | 'gold' | 'none'

export interface Profile {
  id: string
  email: string
  full_name: string | null
  role: UserRole
  avatar_url: string | null
  partner_tier: PartnerTier
  photographer_id: string | null
  bio: string | null
  portfolio_url: string | null
  is_approved: boolean
  total_earnings: number
  pending_earnings: number
  created_at: string
  updated_at: string
}

export interface MediaFolder {
  id: string
  photographer_id: string
  event_name: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Media {
  id: string
  photographer_id: string
  folder_id: string | null
  media_id: string
  filename: string
  media_type: MediaType
  file_path: string
  thumbnail_path: string | null
  description: string | null
  shooting_date: string | null
  keywords: string[] | null
  category: string | null
  is_approved: boolean
  is_featured: boolean
  price_pln: number
  created_at: string
  updated_at: string
}

export interface LicenseRequest {
  id: string
  client_id: string
  media_id: string
  photographer_id: string
  usage_type: UsageType
  usage_description: string | null
  duration: string | null
  resolution: string | null
  price_pln: number
  status: RequestStatus
  created_at: string
  updated_at: string
  completed_at: string | null
}

export interface CustomRequest {
  id: string
  client_id: string
  requested_photographer_id: string | null
  project_description: string
  media_type: MediaType
  usage_type: UsageType
  usage_description: string | null
  timeline: string | null
  budget_estimate: number | null
  status: RequestStatus
  admin_notes: string | null
  created_at: string
  updated_at: string
}

export interface Transaction {
  id: string
  photographer_id: string | null
  client_id: string | null
  type: string
  reference_id: string | null
  amount_pln: number
  photographer_share: number | null
  agency_share: number | null
  status: string
  payment_method: string | null
  transaction_id: string | null
  created_at: string
  completed_at: string | null
}

export interface Partner {
  id: string
  company_name: string
  contact_name: string | null
  email: string
  website: string | null
  logo_url: string | null
  description: string | null
  partnership_type: PartnerTier
  status: string
  application_notes: string | null
  total_spent: number
  created_at: string
  updated_at: string
}

export interface PartnerDiscount {
  id: string
  tier: PartnerTier
  discount_percent: number
  description: string | null
  min_monthly_volume: number | null
  created_at: string
}

export interface AJ247Ad {
  id: string
  location: string
  title: string | null
  image_url: string | null
  link_url: string | null
  is_active: boolean
  display_order: number
  created_at: string
  updated_at: string
}

export interface Setting {
  key: string
  value: string
  description: string | null
  updated_at: string
}
