/**
 * Offline preview harness for dsh-usage-panel.
 *
 * Renders the real browser bundle against the live host route with a tiny
 * React-compatible runtime, writes a standalone HTML page styled with the
 * harness's own light-theme tokens, and optionally screenshots it with a
 * local Chromium.
 *
 * usage: node dev/preview.mjs [zh|en] [--sample] [--shot out.png]
 *
 * --sample renders the synthetic dataset in dev/sample-summary.json instead of
 *          calling a running host, so screenshots never contain real Sessions.
 *
 * Environment:
 *   DSH_ORIGIN  host origin the summary route lives on (default http://127.0.0.1:60341)
 */
import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.dirname(HERE)
const ORIGIN = process.env.DSH_ORIGIN ?? 'http://127.0.0.1:60341'
const ARGS = process.argv.slice(2)
const language = ARGS.includes('en') ? 'en' : 'zh'
const shotIndex = ARGS.indexOf('--shot')
const shotPath = shotIndex >= 0 ? path.resolve(ARGS[shotIndex + 1]) : undefined
const width = 900

const sampleFile = path.join(HERE, 'sample-summary.json')
const sample = ARGS.includes('--sample') ? JSON.parse(fs.readFileSync(sampleFile, 'utf8')) : null
if (sample !== null) console.log('rendering the synthetic sample dataset')

/* ── 1. theme tokens ───────────────────────────────────────────────── */

const tokens = JSON.parse(fs.readFileSync(path.join(HERE, 'tokens.json'), 'utf8'))
const palette = Object.keys(tokens).filter((name) => name.startsWith('--dsw-alias-') || name.startsWith('--dsw-static-'))

/* ── 2. minimal React runtime ──────────────────────────────────────── */

const slotStore = new Map()
const occurrences = new Map()
let currentSlots = null
let slotCursor = 0
let pendingEffects = []
let dirty = false

const React = {
	Fragment: 'Fragment',
	createElement(type, props, ...children) {
		const merged = { ...(props ?? {}) }
		if (children.length > 0) merged.children = children.length === 1 ? children[0] : children
		return { type, props: merged, key: merged.key }
	},
	useState(initial) {
		const cursor = slotCursor++
		const slots = currentSlots
		if (slots[cursor] === undefined) slots[cursor] = typeof initial === 'function' ? initial() : initial
		const set = (value) => {
			const next = typeof value === 'function' ? value(slots[cursor]) : value
			if (next !== slots[cursor]) dirty = true
			slots[cursor] = next
		}
		return [slots[cursor], set]
	},
	useEffect(effect, deps) {
		const cursor = slotCursor++
		const previous = currentSlots[cursor]
		const changed = previous === undefined || deps === undefined || deps.some((value, index) => !Object.is(value, previous[index]))
		if (changed) {
			currentSlots[cursor] = deps
			pendingEffects.push(effect)
		}
	},
	useMemo(factory) { return factory() },
	useRef(initial) {
		const cursor = slotCursor++
		if (currentSlots[cursor] === undefined) currentSlots[cursor] = { current: initial }
		return currentSlots[cursor]
	},
}

/* ── 3. load the real bundle ───────────────────────────────────────── */

let definition = null
let capturedCss = ''
const sandbox = {
	window: { __ModuleLoader__: { load: (def) => { definition = def } } },
	document: {
		querySelector: () => null,
		createElement: () => ({ dataset: {}, textContent: '' }),
		head: { appendChild: (tag) => { capturedCss = tag.textContent } },
	},
	fetch: async (input, init) => {
		if (sample !== null) return { ok: true, status: 200, json: async () => sample }
		return globalThis.fetch(typeof input === 'string' && input.startsWith('/') ? `${ORIGIN}${input}` : input, init)
	},
	console,
}
vm.createContext(sandbox)
vm.runInContext(fs.readFileSync(path.join(ROOT, 'lib/client.js'), 'utf8'), sandbox, { filename: 'client.js' })

let dictionaries = { en: {}, zh: {} }
const features = definition.factory((id) => {
	if (id === 'react') return React
	throw new Error(`unexpected require: ${id}`)
})

features.apply({
	locale: {
		bind: () => (key) => (dictionaries.zh ?? {})[key] ?? key,
		register: (namespace, dict) => { dictionaries = dict; return () => {} },
	},
	slots: { inject: (name, fn) => { fn(); return () => {} }, register: () => () => {} },
	effect: (fn) => { fn(); return () => {} },
})

/* ── 4. render ─────────────────────────────────────────────────────── */

/* React writes camelCase SVG props (`strokeWidth`) as the hyphenated SVG
 * attributes (`stroke-width`); this serializer has to do the same, apart from
 * the handful of SVG attributes that are legitimately camelCase. */
const KEEP_CAMEL = new Set([
	'viewBox', 'preserveAspectRatio', 'gradientUnits', 'patternUnits', 'gradientTransform',
	'clipPathUnits', 'maskUnits', 'markerUnits', 'spreadMethod', 'refX', 'refY', 'textLength',
	'lengthAdjust', 'startOffset', 'attributeName', 'baseFrequency', 'stdDeviation', 'numOctaves',
	'pathLength', 'repeatCount', 'keyTimes', 'keySplines', 'calcMode',
])

function serialize(value) {
	if (value === null || value === undefined || value === false || value === true) return ''
	if (Array.isArray(value)) return value.map(serialize).join('')
	if (typeof value === 'string' || typeof value === 'number') return String(value)
	const { type, props } = value

	if (typeof type === 'function') {
		const name = type.name || 'anonymous'
		const occurrence = occurrences.get(name) ?? 0
		occurrences.set(name, occurrence + 1)
		const key = `${name}#${occurrence}`
		if (!slotStore.has(key)) slotStore.set(key, [])
		const previousSlots = currentSlots
		const previousCursor = slotCursor
		currentSlots = slotStore.get(key)
		slotCursor = 0
		let output
		try {
			output = type(props ?? {})
		} finally {
			currentSlots = previousSlots
			slotCursor = previousCursor
		}
		return serialize(output)
	}

	const attributes = []
	for (const [rawName, raw] of Object.entries(props ?? {})) {
		if (rawName === 'children' || rawName === 'key') continue
		if (typeof raw === 'function' || raw === undefined || raw === null) continue
		if (rawName === 'style') {
			const rules = Object.entries(raw).map(([k, v]) => `${k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}:${v}`).join(';')
			attributes.push(`style="${rules.replace(/"/g, '&quot;')}"`)
			continue
		}
		if (rawName === 'className') { attributes.push(`class="${String(raw).replace(/"/g, '&quot;')}"`); continue }
		if (raw === true) { attributes.push(rawName); continue }
		if (typeof raw === 'object') continue
		const name = KEEP_CAMEL.has(rawName) ? rawName : rawName.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)
		attributes.push(`${name}="${String(raw).replace(/"/g, '&quot;')}"`)
	}
	const open = attributes.length > 0 ? `<${type} ${attributes.join(' ')}>` : `<${type}>`
	const children = Array.isArray(props?.children) ? props.children : [props?.children]
	return `${open}${children.map(serialize).join('')}</${type}>`
}

const dict = dictionaries[language]
const props = { t: (key) => dict[key] ?? key, close: () => {} }

async function renderStable(rounds = 10) {
	let html = ''
	for (let round = 0; round < rounds; round += 1) {
		occurrences.clear()
		pendingEffects = []
		dirty = false
		html = serialize({ type: features.UsageSection, props })
		if (pendingEffects.length === 0) return html
		for (const effect of pendingEffects) effect()
		await new Promise((resolve) => setTimeout(resolve, 900))
		if (!dirty) return html
	}
	return html
}

const markup = await renderStable()
console.log('markup bytes:', markup.length, '· css bytes:', capturedCss.length)

/* ── 5. page ───────────────────────────────────────────────────────── */

const tokenCss = palette.map((name) => `${name}:${tokens[name]}`).join(';')
const page = `<!doctype html>
<html lang="${language}"><head><meta charset="utf-8">
<title>dsh-usage-panel preview</title>
<style>
:root{${tokenCss}}
html,body{margin:0;background:var(--dsw-alias-bg-base)}
body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif;color:var(--dsw-alias-label-primary)}
.panel{width:840px;margin:0 auto;padding:22px 24px 40px;box-sizing:border-box}
${capturedCss}
</style></head>
<body><div class="panel">${markup}</div></body></html>`

const out = path.join(HERE, `preview-${language}.html`)
fs.writeFileSync(out, page)
console.log('wrote', path.relative(process.cwd(), out))

if (shotPath !== undefined) {
	const chrome = [
		'C:/Program Files/Google/Chrome/Application/chrome.exe',
		'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
	].find((candidate) => fs.existsSync(candidate))
	if (chrome === undefined) {
		console.error('no Chromium found; open the HTML file instead')
		process.exit(1)
	}
	const result = spawnSync(chrome, [
		'--headless=new',
		'--disable-gpu',
		'--hide-scrollbars',
		'--no-first-run',
		'--no-default-browser-check',
		'--virtual-time-budget=3000',
		`--window-size=${width},1500`,
		`--screenshot=${shotPath}`,
		`file:///${out.replace(/\\/g, '/')}`,
	], { stdio: 'ignore' })
	if (result.error) throw result.error
	console.log('screenshot', path.relative(process.cwd(), shotPath))
}