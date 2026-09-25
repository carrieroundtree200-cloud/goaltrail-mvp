import { z } from 'zod'

/**
 * A required numeric form field.
 *
 * `z.coerce.number()` alone is not safe here: an untouched input arrives as an
 * empty string, `Number('')` is `0`, and the form would happily save a blank
 * measurement as zero. This rejects the empty string first, then coerces.
 */
export function numericField(message = 'Enter a number.') {
  return z
    .union([z.number(), z.string().trim().min(1, message)])
    .pipe(z.coerce.number({ invalid_type_error: message }))
}
