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
    backup: args.has('--backup'),
    fix: args.has('--fix'),
    dryRun: args.has('--dry-run'),
    id: getValue('--id') || 'quiz-main',
    outDir: getValue('--out-dir') || 'sanity-backups',
  }
}

function invariant(cond, msg) {
  if (!cond) throw new Error(msg)
}

function makeKey() {
  // Sanity keys are typically short-ish strings.
  return randomUUID().replaceAll('-', '').slice(0, 12)
}

function isPlainObject(v) {
  return Boolean(v) && typeof v === 'object' && !Array.isArray(v)
}

function isReferenceItem(v) {
  return (
    isPlainObject(v) &&
    v._type === 'reference' &&
    typeof v._ref === 'string' &&
    v._ref.length > 0
  )
}

function addKeysDeep(value, stats) {
  if (Array.isArray(value)) {
    let changed = false
    const next = value.map((item) => {
      if (isReferenceItem(item)) {
        if (!item._key) {
          stats.keysAdded += 1
          changed = true
          return { ...item, _key: makeKey() }
        }
        return item
      }
      const child = addKeysDeep(item, stats)
      if (child !== item) changed = true
      return child
    })
    return changed ? next : value
  }

  if (isPlainObject(value)) {
    let changed = false
    const next = { ...value }
    for (const [k, v] of Object.entries(value)) {
      const child = addKeysDeep(v, stats)
      if (child !== v) {
        changed = true
        next[k] = child
      }
    }
    return changed ? next : value
  }

  return value
}

async function main() {
  const args = parseArgs(process.argv)
  invariant(args.backup || args.fix, 'Use --backup and/or --fix')

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

  const doc = await client.getDocument(args.id)
  invariant(doc, `Document not found: ${args.id}`)

  if (args.backup) {
    const ts = new Date().toISOString().replaceAll(':', '-')
    const outDirAbs = path.resolve(process.cwd(), args.outDir)
    fs.mkdirSync(outDirAbs, { recursive: true })
    const outPath = path.join(outDirAbs, `${args.id}.${ts}.json`)
    fs.writeFileSync(outPath, JSON.stringify(doc, null, 2) + '\n', 'utf8')
    console.log(`✅ Backup written: ${outPath}`)
  }

  if (args.fix) {
    const stats = { keysAdded: 0 }
    const questions = doc.questions
    invariant(
      isPlainObject(questions),
      `Expected ${args.id}.questions to be an object`
    )

    const fixedQuestions = addKeysDeep(questions, stats)
    if (stats.keysAdded === 0) {
      console.log('ℹ️ No missing _key found. Nothing to patch.')
      return
    }

    console.log(`🔧 Will add _key to ${stats.keysAdded} array item(s).`)
    if (args.dryRun) {
      console.log('🧪 Dry run enabled, not committing patch.')
      return
    }

    await client
      .patch(args.id)
      .set({ questions: fixedQuestions })
      .commit({ autoGenerateArrayKeys: false })

    console.log('✅ Patch committed.')
  }
}

main().catch((err) => {
  console.error('❌ Failed:', err?.message || err)
  process.exitCode = 1
})

