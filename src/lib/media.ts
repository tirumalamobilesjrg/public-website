// Object names of brand logos and category pictures come from the public catalogue view. They are checked against the same
// layout the database enforces before they are turned into an address, so a malformed value can never point elsewhere.
const SEGMENT = '[A-Za-z0-9][A-Za-z0-9_-]{0,79}'
const FILE = '[A-Za-z0-9][A-Za-z0-9._-]{0,99}'
const BRAND_LOGO = new RegExp(`^brands/${SEGMENT}/${FILE}$`)
const CATEGORY_IMAGE = new RegExp(`^categories/${SEGMENT}/${FILE}$`)

export const isBrandLogoPath = (p: unknown): p is string => typeof p === 'string' && BRAND_LOGO.test(p) && !p.includes('..')
export const isCategoryImagePath = (p: unknown): p is string => typeof p === 'string' && CATEGORY_IMAGE.test(p) && !p.includes('..')
