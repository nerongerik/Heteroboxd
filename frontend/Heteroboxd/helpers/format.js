export const formatCount = (n) => {
  if (n < 1000) return n.toString()
  if (n < 1_000_000) return (n / 1000).toFixed(n % 1000 === 0 ? 0 : 1) + 'k'
  return (n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1) + 'M'
}

export const sliceText = (text, chars) => {
  if (chars < 0) return text
  return `${text.slice(0, chars) + (text.length > chars ? '...' : '')}`
}

export const round1 = (n) => (Math.round(round2(n) * 10) / 10).toFixed(1)

export const round2 = (n) => Math.round(n * 100) / 100

export const roundSeen = (seenCount, totalCount) => {
  if (!totalCount || !seenCount || seenCount === 0 || totalCount === 0) return 0
  const percentage = seenCount / totalCount * 100
  return percentage > 0 && percentage < 1 ? 1 : Math.floor(percentage)
}

const createUtcDate = (year, month, day) => {
  const parsed = new Date(Date.UTC(year, month - 1, day))

  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) return null

  return parsed
}

const parseApiDate = (value) => {
  if (!value) return null

  const text = String(value).trim()
  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(text)
  if (iso) {
    const parsed = new Date(text)
    if (!Number.isNaN(parsed.getTime())) return parsed
    return createUtcDate(Number(iso[1]), Number(iso[2]), Number(iso[3]))
  }

  const legacy = /^(\d{1,2})\D+(\d{1,2})\D+(\d{4})(?:\D|$)/.exec(text)
  if (!legacy) return null

  return createUtcDate(Number(legacy[3]), Number(legacy[2]), Number(legacy[1]))
}

const formatApiDate = (date, month) => {
  const parsed = parseApiDate(date)
  if (!parsed) return ''

  return new Intl.DateTimeFormat('en-US', {
    month,
    day: 'numeric',
    year: 'numeric',
    timeZone: 'UTC'
  }).format(parsed)
}

export const parseDate = (date) => {
  return formatApiDate(date, 'long')
}

export const parseDateShort = (date) => {
  return formatApiDate(date, 'short').replace(/, (\d{4})$/, ',\n$1')
}

export const parseOutYear = (date) => {
  const parsed = parseApiDate(date)
  return parsed ? parsed.getUTCFullYear().toString() : ''
}

export const formatTimestamp = (ts) => {
  if (!ts) return ''
  const d = new Date(ts)
  const day = String(d.getDate()).padStart(2, '0')
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const year = d.getFullYear()
  const hours = String(d.getHours()).padStart(2, '0')
  const mins = String(d.getMinutes()).padStart(2, '0')
  return `${day}/${month}/${year} ${hours}:${mins}`
}

export const parseCountry = (country, platform) => {
  if (!country || country.length === 0) return null
  return Object.keys(country).map(c => {
    const code = country[c]?.toUpperCase() ?? null
    if (!code || code === "XX") return null
    if (platform === "web") {
      return code.toLowerCase()
    }
    return code.replace(/./g, char =>
      String.fromCodePoint(127397 + char.charCodeAt(0))
    )
  })
}

export const formatCountry = (code, platform) => {
  if (!code || code.length === 0 || code.toUpperCase() === 'XX') return null
  if (platform === 'web') return code.toLowerCase()
  else return code.replace(/./g, char => String.fromCodePoint(127397 + char.charCodeAt(0)))
}
