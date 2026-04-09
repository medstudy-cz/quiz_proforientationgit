import 'dotenv/config'
import fs from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import { createClient } from '@sanity/client'

function parseArgs(argv) {
  const args = new Set(argv.slice(2))
  const getValue = (name) => {
    const idx = argv.indexOf(name)
    if (idx === -1) return undefined
    return argv[idx + 1]
  }
  return {
    list: args.has('--list'),
    fix: args.has('--fix'),
    dryRun: args.has('--dry-run'),
    outDir: getValue('--out-dir') || 'sanity-backups-simpleQuestion',
    limit: Number(getValue('--limit') || '0') || 0, // 0 => no limit
  }
}

function invariant(cond, msg) {
  if (!cond) throw new Error(msg)
}

function makeKey() {
  return randomUUID().replaceAll('-', '').slice(0, 12)
}

function isPlainObject(v) {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v)
}

function ensureArrayItemKeys(arr, stats) {
  if (!Array.isArray(arr)) return arr
  let changed = false
  const next = arr.map((item) => {
    if (!isPlainObject(item)) return item
    if (item._key) return item
    stats.keysAdded += 1
    changed = true
    return { ...item, _key: makeKey() }
  })
  return changed ? next : arr
}

async function main() {
  const args = parseArgs(process.argv)
  invariant(args.list || args.fix, 'Use --list and/or --fix')

  const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
  const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET || 'production'
  const token = process.env.SANITY_API_WRITE_TOKEN

  invariant(projectId, 'Missing env NEXT_PUBLIC_SANITY_PROJECT_ID')
  invariant(dataset, 'Missing env NEXT_PUBLIC_SANITY_DATASET')

  const client = createClient({
    projectId,
    dataset,
    token,
    apiVersion: '2024-01-01',
    useCdn: false,
  })

  if (args.fix) {
    invariant(token, 'Missing env SANITY_API_WRITE_TOKEN (required for --fix)')
  }

  const ids = await client.fetch(
    `*[_type == "simpleQuestion" && defined(answers) && count(answers[!defined(_key)]) > 0][]._id`
  )

  const allIds = Array.isArray(ids) ? ids : []
  const targetIds = args.limit > 0 ? allIds.slice(0, args.limit) : allIds

  console.log(
    `🔎 Found ${allIds.length} simpleQuestion doc(s) with missing _key in answers[]` +
      (args.limit > 0 ? ` (processing first ${targetIds.length})` : '')
  )

  if (args.list) {
    targetIds.forEach((id) => console.log(`- ${id}`))
  }

  if (!args.fix) return
  if (targetIds.length === 0) return

  // Backup directory (only for docs we touch)
  const ts = new Date().toISOString().replaceAll(':', '-')
  const outDirAbs = path.resolve(process.cwd(), args.outDir, ts)
  fs.mkdirSync(outDirAbs, { recursive: true })

  let docsPatched = 0
  let keysAddedTotal = 0

  for (const id of targetIds) {
    const doc = await client.getDocument(id)
    if (!doc) continue

    const answers = doc.answers
    if (!Array.isArray(answers)) continue

    // Backup original doc
    fs.writeFileSync(
      path.join(outDirAbs, `${id}.json`),
      JSON.stringify(doc, null, 2) + '\n',
      'utf8'
    )

    const stats = { keysAdded: 0 }
    const fixedAnswers = ensureArrayItemKeys(answers, stats)

    if (stats.keysAdded === 0) continue
    keysAddedTotal += stats.keysAdded
    docsPatched += 1

    console.log(`🔧 ${id}: add _key to ${stats.keysAdded} answer item(s)`)
    if (args.dryRun) continue

    await client
      .patch(id)
      .set({ answers: fixedAnswers })
      .commit({ autoGenerateArrayKeys: false })
  }

  console.log(
    args.dryRun
      ? `🧪 Dry run: would patch ${docsPatched} doc(s), add ${keysAddedTotal} _key total.`
      : `✅ Patched ${docsPatched} doc(s), added ${keysAddedTotal} _key total.`
  )
  console.log(`📦 Backups saved under: ${outDirAbs}`)
}

main().catch((err) => {
  console.error('❌ Failed:', err?.message || err)
  process.exitCode = 1
})

