const CANONICAL_GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const POSITIVE_INTEGER_PATTERN = /^[1-9][0-9]*$/

const ROUTE_BUILDERS = {
  Profile: referenceId => `/profile/${referenceId}`,
  Film: referenceId => `/film/${referenceId}`,
  Review: referenceId => `/review/${referenceId}`,
  UserList: referenceId => `/list/${referenceId}`,
  Comment: referenceId => `/review/${referenceId}`
}

export const isCanonicalGuid = (value) => {
  return typeof value === 'string' && CANONICAL_GUID_PATTERN.test(value)
}

export const getNotificationRoute = (referencedObject, referenceId) => {
  if (typeof referencedObject !== 'string' || typeof referenceId !== 'string') return null
  if (!Object.prototype.hasOwnProperty.call(ROUTE_BUILDERS, referencedObject)) return null

  const validReferenceId = referencedObject === 'Film'
    ? POSITIVE_INTEGER_PATTERN.test(referenceId)
    : isCanonicalGuid(referenceId)

  if (!validReferenceId) return null
  return ROUTE_BUILDERS[referencedObject](referenceId)
}
