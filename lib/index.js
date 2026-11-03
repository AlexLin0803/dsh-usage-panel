/**
 * dsh-usage-panel — host half.
 *
 * Folds every durable Session log under `$DSH_HOME/sessions` into one usage
 * summary and serves it over the web server for the browser half in
 * `./client.js`. Nothing here is model-facing: the plugin registers no tool,
 * injects no prompt, and never sends a provider request.
 *
 * The logs are append-only files of concatenated Zstandard frames, each frame
 * holding one batch of JSONL events. Only `assistant/message` events carry
 * provider-reported usage, so the fold reads those, plus the Session header,
 * `session/title`, `user/message` and `step/end`.
 *
 * @module dsh-usage-panel
 */

import { promises as fs } from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { zstdDecompressSync } from 'node:zlib'

/** Cordis plugin name. */
export const name = 'usage-panel'

/** The HTTP route is the plugin's only outward face. */
export const inject = ['webServer']

/** Route the browser half reads. */
const API_PATH = '/usage-panel/api/summary'

/** A durable Session log artifact, compressed or not. */
const LOG_NAME = /^session\.v\d+\.jsonl(\.zstd)?$/

/** Little-endian Zstandard frame magic `28 b5 2f fd`. */
const FRAME_MAGIC = Buffer.from([0x28, 0xb5, 0x2f, 0xfd])
const FRAME_MAGIC_U32 = FRAME_MAGIC.readUInt32LE(0)

/** Cached summary lifetime before a request rescans the logs. */
const CACHE_TTL_MS = 20_000

/** Bar-chart ranges the browser may ask for. */
const RANGES = [7, 30, 90]

/** Round a possibly malformed provider count to a finite non-negative integer. */
function count(value) {
	if (typeof value !== 'number' || !Number.isFinite(value) || value <= 0) return 0
	return Math.round(value)
}

/** The harness home, matching `@deepseek-ai/dsh-home-paths` precedence. */
function resolveHome() {
	const configured = process.env.DSH_HOME
	if (typeof configured === 'string' && configured.trim() !== '') return path.resolve(configured.trim())
	return path.join(os.homedir(), '.dsh')
}

/** Local calendar key `YYYY-MM-DD` for an epoch-millisecond timestamp. */
function dayKey(ms) {
	const date = new Date(ms)
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${date.getFullYear()}-${month}-${day}`
}

/** Local calendar key for a Date. */
function keyOfDate(date) {
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')
	return `${date.getFullYear()}-${month}-${day}`
}

/** Start of the local day containing `ms`. */
function startOfDay(ms) {
	const date = new Date(ms)
	date.setHours(0, 0, 0, 0)
	return date.getTime()
}

/** A fresh per-session fold. */
function emptySession(id, file) {
	return {
		id,
		file,
		cwd: null,
		title: null,
		createdAt: 0,
		lastAt: 0,
		messages: 0,
		userMessages: 0,
		steps: 0,
		tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
		models: new Map(),
		days: new Map(),
	}
}

/** The per-model accumulator of one session. */
function modelBucket(session, model, provider) {
	let bucket = session.models.get(model)
	if (bucket === undefined) {
		bucket = {
			model,
			provider,
			messages: 0,
			tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
		}
		session.models.set(model, bucket)
	} else if (bucket.provider === null && provider !== null) {
		bucket.provider = provider
	}
	return bucket
}

/** The per-day accumulator of one session. */
function dayBucket(session, key) {
	let bucket = session.days.get(key)
	if (bucket === undefined) {
		bucket = { tokens: 0, messages: 0, models: new Map() }
		session.days.set(key, bucket)
	}
	return bucket
}

/** Fold one parsed Session event into the session accumulator. */
function foldEvent(session, event) {
	const type = event?.type
	if (typeof type !== 'string') return
	const time = typeof event.time === 'number' && Number.isFinite(event.time) ? event.time : 0
	if (time > session.lastAt) session.lastAt = time

	if (type === 'session') {
		if (typeof event.cwd === 'string') session.cwd = event.cwd
		if (typeof event.createdAt === 'number') session.createdAt = event.createdAt
		if (typeof event.title === 'string') session.title = event.title
		return
	}

	if (type === 'session/title') {
		const title = event.data?.title ?? event.data?.text ?? event.title
		if (typeof title === 'string' && title.trim() !== '') session.title = title.trim()
		return
	}

	if (type === 'user/message') {
		session.userMessages += 1
		return
	}

	if (type === 'step/end') {
		session.steps += 1
		return
	}

	if (type !== 'assistant/message') return

	session.messages += 1
	const usage = event.data?.usage
	if (usage === null || typeof usage !== 'object') return

	const input = count(usage.inputTokens)
	const output = count(usage.outputTokens)
	const cacheRead = count(usage.cacheReadTokens)
	const cacheWrite = count(usage.cacheWriteTokens)
	const reported = count(usage.totalTokens)
	const total = reported > 0 ? reported : input + output + cacheRead + cacheWrite
	if (total === 0 && input === 0 && output === 0) return

	const source = event.data?.message?.source
	const model = typeof source?.model === 'string' && source.model !== '' ? source.model : 'unknown'
	const provider = typeof source?.provider === 'string' && source.provider !== '' ? source.provider : null

	const tokens = session.tokens
	tokens.input += input
	tokens.output += output
	tokens.cacheRead += cacheRead
	tokens.cacheWrite += cacheWrite
	tokens.total += total

	const modelEntry = modelBucket(session, model, provider)
	modelEntry.messages += 1
	modelEntry.tokens.input += input
	modelEntry.tokens.output += output
	modelEntry.tokens.cacheRead += cacheRead
	modelEntry.tokens.cacheWrite += cacheWrite
	modelEntry.tokens.total += total

	if (time > 0) {
		const day = dayBucket(session, dayKey(time))
		day.tokens += total
		day.messages += 1
		day.models.set(model, (day.models.get(model) ?? 0) + total)
	}
}

/** Fold a decoded UTF-8 JSONL chunk into the session accumulator. */
function foldText(session, text) {
	if (text === '') return
	let start = 0
	while (start < text.length) {
		let end = text.indexOf('\n', start)
		if (end < 0) end = text.length
		const line = text.slice(start, end).trim()
		start = end + 1
		if (line === '') continue
		let event
		try {
			event = JSON.parse(line)
		} catch {
			continue
		}
		foldEvent(session, event)
	}
}

/**
 * Decode the concatenated Zstandard frames held by `buffer` from `from`.
 *
 * Node's one-shot decoder stops after the first frame, so frames are split on
 * the frame magic and decoded one at a time. A magic that a payload happens to
 * contain splits a frame; that slice fails to decode and the frame is extended
 * to the next candidate. A trailing frame that is still being written fails
 * every extension and stops the walk, leaving `consumed` on the last complete
 * frame so the next scan resumes exactly there.
 *
 * @param buffer - the whole log artifact.
 * @param from - byte offset of a known frame boundary.
 * @returns the decoded text and the offset after the last complete frame.
 */
function decodeFrames(buffer, from) {
	const parts = []
	let cursor = from
	while (cursor + 4 <= buffer.length) {
		if (buffer.readUInt32LE(cursor) !== FRAME_MAGIC_U32) break
		let probeEnd = buffer.indexOf(FRAME_MAGIC, cursor + 4)
		if (probeEnd < 0) probeEnd = buffer.length
		let decoded = null
		for (;;) {
			try {
				decoded = zstdDecompressSync(buffer.subarray(cursor, probeEnd)).toString('utf8')
				break
			} catch {
				const next = probeEnd >= buffer.length ? -1 : buffer.indexOf(FRAME_MAGIC, probeEnd + 4)
				if (next < 0) break
				probeEnd = next
			}
		}
		if (decoded === null) break
		parts.push(decoded)
		cursor = probeEnd
	}
	return { text: parts.join(''), consumed: cursor }
}

/** Read a log artifact into decoded text, resuming from the cached frame boundary. */
function decodeFile(buffer, file, previous) {
	if (!file.endsWith('.zstd')) {
		// A plaintext log; rewriting it is the only way its content changes.
		return { text: buffer.toString('utf8'), consumed: buffer.length }
	}
	if (previous !== undefined && previous.consumed > 0 && buffer.length > previous.consumed) {
		const tail = decodeFrames(buffer, previous.consumed)
		return { text: tail.text, consumed: tail.consumed, append: true }
	}
	return decodeFrames(buffer, 0)
}

/** Every durable log under the sessions root. */
async function listLogs(root) {
	const files = []
	const walk = async (dir, depth) => {
		let entries
		try {
			entries = await fs.readdir(dir, { withFileTypes: true })
		} catch {
			return
		}
		for (const entry of entries) {
			const full = path.join(dir, entry.name)
			if (entry.isDirectory()) {
				if (depth < 3) await walk(full, depth + 1)
				continue
			}
			if (!entry.isFile()) continue
			if (LOG_NAME.test(entry.name)) files.push(full)
		}
	}
	await walk(root, 0)
	return files
}

/**
 * Cached per-file folds. Each entry remembers the artifact generation and the
 * last decoded frame boundary, so an appended batch is decoded on its own.
 */
const fileCache = new Map()

/** Resolve one artifact into its current session fold. */
async function loadSession(file) {
	const stat = await fs.stat(file)
	const previous = fileCache.get(file)
	if (previous !== undefined && previous.size === stat.size && previous.mtimeMs === stat.mtimeMs) return previous.session

	const buffer = await fs.readFile(file)
	const id = path.basename(path.dirname(file))

	if (previous !== undefined && stat.size >= previous.consumed && previous.session.id === id) {
		const resumable = buffer.length > previous.consumed ? decodeFrames(buffer, previous.consumed) : { text: '', consumed: previous.consumed }
		foldText(previous.session, resumable.text)
		previous.size = stat.size
		previous.mtimeMs = stat.mtimeMs
		previous.consumed = resumable.consumed
		return previous.session
	}

	const session = emptySession(id, file)
	const decoded = decodeFile(buffer, file, undefined)
	foldText(session, decoded.text)
	fileCache.set(file, { size: stat.size, mtimeMs: stat.mtimeMs, consumed: decoded.consumed, session })
	return session
}

/** Fold every readable Session into one summary object. */
async function collect(root) {
	const files = await listLogs(root)
	const sessions = []
	const problems = []
	for (const file of files) {
		try {
			sessions.push(await loadSession(file))
		} catch (error) {
			problems.push({ file, message: error instanceof Error ? error.message : String(error) })
		}
	}
	return { sessions, problems, scanned: files.length }
}

/** The totals of one accumulator pair. */
function emptyTotals() {
	return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0, messages: 0, steps: 0 }
}

/** Add one token record into a totals record. */
function addTotals(target, tokens) {
	target.input += tokens.input
	target.output += tokens.output
	target.cacheRead += tokens.cacheRead
	target.cacheWrite += tokens.cacheWrite
	target.total += tokens.total
}

/** Build the wire summary from the folded sessions. */
function summarize({ sessions, problems, scanned }, root, rangeDays) {
	const totals = emptyTotals()
	const models = new Map()
	const providers = new Map()
	const days = new Map()

	let firstAt = 0
	let lastAt = 0
	let userMessages = 0
	let activeSessions = 0

	for (const session of sessions) {
		if (session.messages === 0 && session.userMessages === 0) continue
		activeSessions += 1
		userMessages += session.userMessages
		totals.messages += session.messages
		totals.steps += session.steps
		addTotals(totals, session.tokens)

		if (session.createdAt > 0 && (firstAt === 0 || session.createdAt < firstAt)) firstAt = session.createdAt
		if (session.lastAt > 0 && session.lastAt > lastAt) lastAt = session.lastAt

		for (const bucket of session.models.values()) {
			let entry = models.get(bucket.model)
			if (entry === undefined) {
				entry = {
					model: bucket.model,
					provider: bucket.provider,
					messages: 0,
					tokens: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
					sessions: 0,
				}
				models.set(bucket.model, entry)
			}
			entry.messages += bucket.messages
			entry.sessions += 1
			addTotals(entry.tokens, bucket.tokens)
			if (entry.provider === null && bucket.provider !== null) entry.provider = bucket.provider
			if (bucket.provider !== null) {
				const provider = providers.get(bucket.provider) ?? { provider: bucket.provider, total: 0, messages: 0, models: new Set() }
				provider.total += bucket.tokens.total
				provider.messages += bucket.messages
				provider.models.add(bucket.model)
				providers.set(bucket.provider, provider)
			}
		}

		for (const [key, bucket] of session.days) {
			let day = days.get(key)
			if (day === undefined) {
				day = { tokens: 0, messages: 0, sessions: 0, models: new Map() }
				days.set(key, day)
			}
			day.tokens += bucket.tokens
			day.messages += bucket.messages
			day.sessions += 1
			for (const [model, tokens] of bucket.models) day.models.set(model, (day.models.get(model) ?? 0) + tokens)
		}
	}

	const today = startOfDay(Date.now())
	const dayList = []
	for (let offset = 181; offset >= 0; offset -= 1) {
		const date = new Date(today)
		date.setDate(date.getDate() - offset)
		const key = keyOfDate(date)
		const day = days.get(key)
		dayList.push({ date: key, tokens: day?.tokens ?? 0, messages: day?.messages ?? 0, sessions: day?.sessions ?? 0 })
	}

	const activeDays = dayList.filter((day) => day.tokens > 0).length
	const peak = dayList.reduce((best, day) => (day.tokens > best.tokens ? day : best), { date: null, tokens: 0 })

	let streak = 0
	for (let index = dayList.length - 1; index >= 0; index -= 1) {
		if (dayList[index].tokens > 0) streak += 1
		else break
	}

	const modelRows = [...models.values()]
		.map((entry) => ({
			model: entry.model,
			provider: entry.provider,
			total: entry.tokens.total,
			input: entry.tokens.input,
			output: entry.tokens.output,
			cacheRead: entry.tokens.cacheRead,
			cacheWrite: entry.tokens.cacheWrite,
			messages: entry.messages,
			sessions: entry.sessions,
			share: totals.total > 0 ? entry.tokens.total / totals.total : 0,
		}))
		.sort((a, b) => b.total - a.total)

	const series = []
	for (let offset = rangeDays - 1; offset >= 0; offset -= 1) {
		const date = new Date(today)
		date.setDate(date.getDate() - offset)
		const key = keyOfDate(date)
		const day = days.get(key)
		const byModel = {}
		if (day !== undefined) for (const [model, tokens] of day.models) byModel[model] = tokens
		series.push({ date: key, tokens: day?.tokens ?? 0, messages: day?.messages ?? 0, byModel })
	}

	const topSessions = sessions
		.filter((session) => session.tokens.total > 0)
		.sort((a, b) => b.tokens.total - a.tokens.total)
		.slice(0, 8)
		.map((session) => ({
			id: session.id,
			title: session.title,
			cwd: session.cwd,
			updatedAt: session.lastAt,
			total: session.tokens.total,
			messages: session.messages,
			steps: session.steps,
			models: [...session.models.values()].sort((a, b) => b.tokens.total - a.tokens.total).map((bucket) => bucket.model),
		}))

	const cacheHitRate = totals.cacheRead + totals.input > 0 ? totals.cacheRead / (totals.cacheRead + totals.input) : 0

	return {
		ok: true,
		generatedAt: Date.now(),
		root,
		rangeDays,
		scanned,
		sessions: { total: sessions.length, active: activeSessions, userMessages },
		window: { firstAt, lastAt },
		totals: {
			...totals,
			cacheHitRate,
			activeDays,
			streak,
			peak,
			avgPerActiveDay: activeDays > 0 ? Math.round(totals.total / activeDays) : 0,
			days: dayList.length,
		},
		heatmap: { days: dayList },
		series,
		models: modelRows,
		providers: [...providers.values()]
			.map((entry) => ({ provider: entry.provider, total: entry.total, messages: entry.messages, models: [...entry.models] }))
			.sort((a, b) => b.total - a.total),
		topSessions,
		problems,
	}
}

/** One cached summary plus the generation it was folded from. */
let cached = null
let inflight = null

/** Fold the logs, sharing one scan between concurrent requests. */
async function refresh(root, rangeDays, force) {
	const now = Date.now()
	if (!force && cached !== null && cached.rangeDays === rangeDays && now - cached.at < CACHE_TTL_MS) return cached.payload
	if (inflight !== null && inflight.rangeDays === rangeDays) return inflight.promise
	const promise = (async () => {
		const collected = await collect(root)
		const payload = summarize(collected, root, rangeDays)
		cached = { at: Date.now(), rangeDays, payload }
		return payload
	})()
	inflight = { rangeDays, promise }
	try {
		return await promise
	} finally {
		if (inflight !== null && inflight.promise === promise) inflight = null
	}
}

/** Answer one summary request. */
function handler(root, request, response) {
	if (request.method !== 'GET' && request.method !== 'HEAD') {
		response.statusCode = 405
		response.setHeader('allow', 'GET, HEAD')
		response.end()
		return
	}
	let url
	try {
		url = new URL(String(request.url ?? API_PATH), 'http://localhost')
	} catch {
		response.statusCode = 400
		response.end()
		return
	}
	const requested = Number(url.searchParams.get('days'))
	const rangeDays = RANGES.includes(requested) ? requested : 30
	const force = url.searchParams.get('refresh') === '1'
	refresh(root, rangeDays, force).then(
		(payload) => {
			if (response.writableEnded) return
			response.statusCode = 200
			response.setHeader('content-type', 'application/json; charset=utf-8')
			response.setHeader('cache-control', 'no-store')
			response.end(JSON.stringify(payload))
		},
		(error) => {
			if (response.writableEnded) return
			response.statusCode = 500
			response.setHeader('content-type', 'application/json; charset=utf-8')
			response.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : String(error) }))
		},
	)
}

/**
 * Mount the usage summary route.
 * @param ctx - host plugin context carrying the web server.
 */
export function apply(ctx) {
	const root = path.join(resolveHome(), 'sessions')
	ctx.effect(() => ctx.webServer.register({
		kind: 'exact',
		path: API_PATH,
		handler: (request, response) => handler(root, request, response),
	}), 'usage-panel: GET /usage-panel/api/summary')
}