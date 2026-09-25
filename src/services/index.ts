import type { DataService } from './dataService'
import { LocalDataService } from './localDataService'

/**
 * The one place that chooses an implementation.
 *
 * To move onto Supabase later: write `SupabaseDataService implements DataService`
 * and swap the line below. Nothing else in the app needs to change.
 */
export const dataService: DataService = new LocalDataService()

export type * from './dataService'
