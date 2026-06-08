import Anthropic from '@anthropic-ai/sdk'
import { createServiceClient } from '@/lib/supabase/service'
import { getTodayInAppTimeZoneISO, getWeekdayFromISODate, addDaysToISODate } from '@/lib/date'

// ── Types ─────────────────────────────────────────────────────────────────────

export type StandupFilter = 'overview' | 'active' | 'backlog' | 'done' | 'review'

export const VALID_STANDUP_FILTERS = new Set<StandupFilter>([
  'overview', 'active', 'backlog', 'done', 'review',
])

const ACTIVE_STATUSES = new Set(['in_progress', 'in_review', 'blocked', 'todo'])

const STATUS_EMOJI: Record<string, string> = {
  blocked: '🚧', in_progress: '🔄', in_review: '👀', todo: '📝', backlog: '📦', done: '✅',
}
const STATUS_ORDER = ['blocked', 'in_progress', 'in_review', 'todo', 'backlog', 'done']

const PRIORITY_BADGE: Record<string, string> = {
  urgent: ' 🔴', high: ' 🟠', medium: '', low: '',
}

// ── Quote (Haiku-generated, verbatim from curated books) ─────────────────────

async function dailyQuote(): Promise<string> {
  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: [
          'Give me one verbatim quote from one of these books (choose randomly — vary the book each time):',
          '- "How to Say It" by Rosalie Maggio',
          '- "Startup Mindsets" by Earl Valencia and Dan Gonzales',
          '- "Simply Said" by Jay Sullivan',
          '- "The Making of a Manager" by Julie Zhuo',
          '- "Outliers: The Story of Success" by Malcolm Gladwell',
          '- "Zero to One" by Peter Thiel',
          '',
          'Reply with only the quote, the author, and the book title in this exact format — no extra text:',
          '"<quote>" — <Author>, <Book Title>',
        ].join('\n'),
      }],
    })
    const raw = response.content[0].type === 'text' ? response.content[0].text.trim() : ''
    const match = raw.match(/^"(.+?)"\s*[—–-]+\s*(.+)$/)
    if (match) return `<i>"${esc(match[1])}"</i>\n— <i>${esc(match[2])}</i>`
    return `<i>${esc(raw)}</i>`
  } catch {
    return ''
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

/** Returns ISO bounds for the current and previous Sun–Sat week. */
function getWeekBounds(todayISO: string) {
  const dow = getWeekdayFromISODate(todayISO) // 0=Sun … 6=Sat
  const weekStart    = addDaysToISODate(todayISO, -dow)
  const weekEnd      = addDaysToISODate(weekStart, 6)
  const lastWeekStart = addDaysToISODate(weekStart, -7)
  const lastWeekEnd  = addDaysToISODate(weekStart, -1)
  return { weekStart, weekEnd, lastWeekStart, lastWeekEnd }
}

/** Extracts the ISO date (YYYY-MM-DD) in Asia/Manila tz from a UTC timestamp. */
function manilaDayOf(timestamp: string): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date(timestamp))
  const y = parts.find(p => p.type === 'year')?.value
  const m = parts.find(p => p.type === 'month')?.value
  const d = parts.find(p => p.type === 'day')?.value
  return `${y}-${m}-${d}`
}

/** Formats two ISO dates as "Apr 27 – May 3". */
function formatWeekLabel(startISO: string, endISO: string): string {
  const fmt = (iso: string) => {
    const [y, mo, d] = iso.split('-').map(Number)
    return new Date(Date.UTC(y, mo - 1, d))
      .toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' })
  }
  return `${fmt(startISO)} – ${fmt(endISO)}`
}

function taskLine(t: any, opts: { showStatus?: boolean } = {}): string {
  const code   = t.task_number ? `<code>T-${String(t.task_number).padStart(3, '0')}</code> ` : ''
  const title  = esc(t.title)
  const badge  = PRIORITY_BADGE[t.priority] ?? ''
  const status = opts.showStatus ? ` ${STATUS_EMOJI[t.status] ?? ''}` : ''
  const due    = t.due_date
    ? ` · ${new Date(t.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}`
    : ''
  return `▸ ${code}${title}${badge}${status}${due}`
}


type Task = Record<string, unknown>

/** Groups tasks by assigned_to, returning ordered [member, tasks[]] pairs. Unassigned last. */
function groupByMember(tasks: Task[]): [string, Task[]][] {
  const map = new Map<string, Task[]>()
  for (const t of tasks) {
    const key = (t.assigned_to as string | null)?.trim() || '(Unassigned)'
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(t)
  }
  const entries = [...map.entries()]
  const assigned   = entries.filter(([k]) => k !== '(Unassigned)').sort(([a], [b]) => a.localeCompare(b))
  const unassigned = entries.filter(([k]) => k === '(Unassigned)')
  return [...assigned, ...unassigned]
}

/** Renders a member-grouped block; each task line may show a status emoji. */
function renderByMember(tasks: Task[], opts: { showStatus?: boolean } = {}): string {
  const groups = groupByMember(tasks)
  let out = ''
  for (const [member, memberTasks] of groups) {
    out += `\n👤 <b>${esc(member)}</b>\n`
    memberTasks.forEach(t => { out += taskLine(t, { showStatus: opts.showStatus }) + '\n' })
  }
  return out
}

function greeting(): string {
  const hour = parseInt(
    new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila', hour: 'numeric', hour12: false })
  )
  if (hour < 12) return `Good morning, team! Let's make today count. 🌅`
  if (hour < 17) return `Good afternoon, team! Here's a quick look at the board. ☀️`
  return `Good evening, team! Here's your end-of-day update. 🌙`
}

// ── Data ──────────────────────────────────────────────────────────────────────

export type StandupData = {
  dateStr:       string
  weekStart:     string   // ISO, e.g. "2026-04-27" (Sunday)
  weekEnd:       string   // ISO, e.g. "2026-05-03" (Saturday)
  lastWeekStart: string
  lastWeekEnd:   string
  overdue:       any[]
  blocked:       any[]
  inProgress:    any[]
  inReview:      any[]
  todo:          any[]
  backlog:       any[]
  done:          any[]   // all done tasks (for Done tab)
  doneThisWeek:  any[]  // done tasks updated within this Sun–Sat
  doneLastWeek:  any[]  // done tasks updated within last Sun–Sat
  activeCount:   number
  doneCount:     number
}

export async function fetchStandupData(): Promise<StandupData> {
  const supabase = createServiceClient()

  const { data, error } = await supabase
    .from('tasks')
    .select('id, task_number, title, status, priority, due_date, assigned_to, updated_at, completed_at')
    .order('priority', { ascending: false })

  if (error) console.error('[standup] tasks query error:', error.message)

  const tasks: any[] = data || []
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const dateStr = today.toLocaleDateString('en-PH', {
    timeZone: 'Asia/Manila',
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
  })

  const todayISO = getTodayInAppTimeZoneISO()
  const { weekStart, weekEnd, lastWeekStart, lastWeekEnd } = getWeekBounds(todayISO)

  const overdue    = tasks.filter(t => t.due_date && new Date(t.due_date) < today && t.status !== 'done')
  const blocked    = tasks.filter(t => t.status === 'blocked')
  const inProgress = tasks.filter(t => t.status === 'in_progress')
  const inReview   = tasks.filter(t => t.status === 'in_review')
  const todo       = tasks.filter(t => t.status === 'todo')
  const backlog    = tasks.filter(t => t.status === 'backlog')
  const done       = tasks.filter(t => t.status === 'done')

  const doneThisWeek = done.filter(t => {
    if (!t.completed_at) return false
    const d = manilaDayOf(t.completed_at)
    return d >= weekStart && d <= weekEnd
  })
  const doneLastWeek = done.filter(t => {
    if (!t.completed_at) return false
    const d = manilaDayOf(t.completed_at)
    return d >= lastWeekStart && d <= lastWeekEnd
  })

  return {
    dateStr, weekStart, weekEnd, lastWeekStart, lastWeekEnd,
    overdue, blocked, inProgress, inReview, todo, backlog, done,
    doneThisWeek, doneLastWeek,
    activeCount: blocked.length + inProgress.length + inReview.length + todo.length,
    doneCount:   done.length,
  }
}

// ── Page builder ─────────────────────────────────────────────────────────────

export async function buildStandupPage(
  data: StandupData,
  filter: StandupFilter,
  _page: number,   // unused — no member pagination for DSU
): Promise<{ text: string; keyboard: object }> {
  const header =
    `${greeting()}\n\n` +
    `📋 <b>DEVCON COHORT 4 — Daily Stand Up</b>\n` +
    `<i>${esc(data.dateStr)}</i>`

  let text = ''

  if (filter === 'overview') {
    text = `${header}\n\n`
    text += `📊 <b>Overview</b>\n`
    text += `🔄 In Progress: <b>${data.inProgress.length}</b>\n`
    text += `👀 In Review: <b>${data.inReview.length}</b>\n`
    text += `📝 To Do: <b>${data.todo.length}</b>\n`
    text += `📦 Backlog: <b>${data.backlog.length}</b>\n`
    text += `✅ Done: <b>${data.doneCount}</b>\n`
    text += `🚧 Blocked: <b>${data.blocked.length}</b>`

    // Done this week
    const thisWeekLabel = formatWeekLabel(data.weekStart, data.weekEnd)
    text += `\n\n✅ <b>Done this week</b> <i>(${thisWeekLabel})</i>`
    if (data.doneThisWeek.length === 0) {
      text += `\n<i>No tasks completed this week yet.</i>`
    } else {
      text += renderByMember(data.doneThisWeek)
    }

    text += `\n📚 <b>Reminder:</b> <i>Read and finish your assigned books, cohorts! Consistency compounds.</i>`

    const quote = await dailyQuote()
    if (quote) text += `\n\n${quote}`

  } else if (filter === 'active') {
    const activeTasks = [...data.inProgress, ...data.inReview, ...data.todo]
    text = `${header}\n\n🔄 <b>Active</b> <i>(${data.activeCount})</i>`
    if (data.activeCount === 0) {
      text += `\n\n<i>No active tasks right now.</i>`
    } else {
      text += renderByMember(activeTasks, { showStatus: true })
    }

  } else if (filter === 'backlog') {
    text = `${header}\n\n📦 <b>Backlog</b> <i>(${data.backlog.length})</i>`
    if (data.backlog.length === 0) {
      text += `\n\n<i>Backlog is clear!</i>`
    } else {
      text += renderByMember(data.backlog)
    }

  } else if (filter === 'review') {
    text = `${header}\n\n👀 <b>For Review</b> <i>(${data.inReview.length})</i>`
    if (data.inReview.length === 0) {
      text += `\n\n<i>Nothing waiting for review right now.</i>`
    } else {
      text += renderByMember(data.inReview)
    }

  } else {
    // done — this week only
    const thisWeekLabel = formatWeekLabel(data.weekStart, data.weekEnd)
    text = `${header}\n\n✅ <b>Done this week</b> <i>(${thisWeekLabel})</i>`
    if (data.doneThisWeek.length === 0) {
      text += `\n\n<i>No tasks completed this week yet.</i>`
    } else {
      text += renderByMember(data.doneThisWeek)
    }
  }

  return { text: text.trimEnd(), keyboard: buildKeyboard(data, filter) }
}

function buildKeyboard(data: StandupData, active: StandupFilter): object {
  const btn = (f: StandupFilter, label: string) => ({
    text: f === active ? `· ${label}` : label,
    callback_data: `standup|${f}|0`,
  })

  return {
    inline_keyboard: [[
      btn('overview', '📊 Overview'),
      btn('active',   `Active (${data.activeCount})`),
      btn('backlog',  `Backlog (${data.backlog.length})`),
      btn('review',   `Review (${data.inReview.length})`),
      btn('done',     `Done (${data.doneThisWeek.length})`),
    ]],
  }
}

// ── Send helpers ──────────────────────────────────────────────────────────────

export interface SendOptions {
  replyToMessageId?: number
  keyboard?: object
}

export async function sendTelegramMessage(
  text: string,
  options: SendOptions = {}
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createServiceClient()
  const { data } = await supabase
    .from('telegram_config')
    .select('bot_token, chat_id')
    .limit(1)
    .single()

  const token  = data?.bot_token?.trim() || process.env.TELEGRAM_BOT_TOKEN
  const chatId = data?.chat_id?.trim()   || process.env.TELEGRAM_CHAT_ID

  if (!token || !chatId) return { ok: false, error: 'Telegram not configured' }

  const payload: Record<string, unknown> = {
    chat_id: chatId, text, parse_mode: 'HTML',
    allow_sending_without_reply: true,
  }
  if (options.replyToMessageId) payload.reply_to_message_id = options.replyToMessageId
  if (options.keyboard)         payload.reply_markup = options.keyboard

  const res  = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json()
  if (!body.ok) return { ok: false, error: body.description }
  return { ok: true }
}

/** Send the standup overview card with section filter buttons. */
export async function sendStandupReport(options: { replyToMessageId?: number } = {}) {
  const data = await fetchStandupData()
  const { text, keyboard } = await buildStandupPage(data, 'overview', 0)
  return sendTelegramMessage(text, { ...options, keyboard })
}

/** Kept for any legacy callers. */
export async function generateStandupMessage(): Promise<string> {
  const data = await fetchStandupData()
  return (await buildStandupPage(data, 'overview', 0)).text
}
