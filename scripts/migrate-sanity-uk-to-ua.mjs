/**
 * Перейменовує ключі локалі `uk` → `ua` у документах Sanity (quiz, university, school)
 * та поле language у simpleQuestion.
 *
 * Потрібен SANITY_API_WRITE_TOKEN (Editor або Administrator).
 *
 *   node scripts/migrate-sanity-uk-to-ua.mjs --dry-run
 *   node scripts/migrate-sanity-uk-to-ua.mjs
 */
import { config as loadEnv } from 'dotenv'
import { resolve } from 'node:path'
import { createClient } from '@sanity/client'

loadEnv({ path: resolve(process.cwd(), '.env.local') })
loadEnv({ path: resolve(process.cwd(), '.env') })

const dryRun = process.argv.includes('--dry-run')
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
const token =
  process.env.SANITY_API_WRITE_TOKEN ||
  process.env.SANITY_AUTH_TOKEN ||
  process.env.SANITY_TOKEN

if (!projectId) {
  console.error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID')
  process.exit(1)
}
if (!token) {
  console.error('Missing SANITY_API_WRITE_TOKEN (or SANITY_AUTH_TOKEN) for write access')
  process.exit(1)
}

const client = createClient({
  projectId,
  dataset,
  apiVersion: '2024-01-01',
  token,
  useCdn: false,
})

/** Рекурсивно: ключ об'єкта `uk` → `ua` (якщо `ua` вже є — лишаємо `ua`, `uk` видаляємо) */
function renameUkToUaDeep(value) {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(renameUkToUaDeep)
  const obj = { ...value }
  if ('uk' in obj) {
    const migrated = renameUkToUaDeep(obj.uk)
    if (!('ua' in obj)) {
      obj.ua = migrated
    }
    delete obj.uk
  }
  for (const k of Object.keys(obj)) {
    const v = obj[k]
    if (v !== null && typeof v === 'object') {
      obj[k] = renameUkToUaDeep(v)
    }
  }
  return obj
}

async function main() {
  const ids = await client.fetch(
    `*[_type in ["quiz","university","school","simpleQuestion"]]._id`
  )
  console.log(`Found ${ids.length} documents to check`)

  let updated = 0
  for (const id of ids) {
    const doc = await client.fetch(`*[_id == $id][0]`, { id })
    if (!doc) continue

    let next = renameUkToUaDeep(doc)

    if (doc._type === 'simpleQuestion' && doc.language === 'uk') {
      next = { ...next, language: 'ua' }
    }

    const same =
      JSON.stringify(stripRevForCompare(doc)) === JSON.stringify(stripRevForCompare(next))
    if (same) continue

    console.log(dryRun ? '[dry-run] would update' : 'Updating', id, doc._type)
    if (!dryRun) {
      const { _rev, ...replace } = next
      await client.createOrReplace(replace)
    }
    updated++
  }

  console.log(dryRun ? `Dry run: ${updated} documents would change` : `Done: ${updated} documents updated`)
}

function stripRevForCompare(doc) {
  const o = JSON.parse(JSON.stringify(doc))
  delete o._rev
  delete o._updatedAt
  return o
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
