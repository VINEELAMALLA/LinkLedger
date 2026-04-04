"use client"

import { useEffect, useMemo, useState, useRef } from "react"
import { useRouter } from 'next/navigation'
import {
  Bell,
  BookOpen,
  Briefcase,
  Compass,
  ExternalLink,
  FolderKanban,
  Link2,
  Search,
  Sparkles,
  User,
  Edit,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type Category = string

type Item = {
  id: string
  source_url: string
  resource_url?: string
  description_links?: string[]
  user_email: string
  platform: string
  opportunity_title?: string
  summary: string
  raw_description: string
  category: string
  concept_topic: string | null
  keywords: string[]
  organization_name: string
  primary_link: string
  deadline: string | null
  deadline_status: string
}

type Stats = {
  total: number
  byCategory: Record<string, number>
  deadlinesUpcoming: number
  deadlinesOverdue: number
  latestProcessedAt: string | null
}

type Notification = {
  id: string
  message: string
  deadline: string | null
  primary_link: string
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "/api"

const defaultCategories: Array<{ value: Category; label: string; icon: typeof FolderKanban }> = [
  { value: "", label: "Dashboard", icon: FolderKanban },
  { value: "Internship", label: "Internships", icon: Briefcase },
  { value: "Job", label: "Jobs", icon: Briefcase },
  { value: "Course", label: "Courses", icon: BookOpen },
  { value: "Theory Concept", label: "Theory Concepts", icon: Sparkles },
  { value: "AI Tool", label: "AI Tools", icon: Link2 },
  { value: "Other", label: "Other", icon: FolderKanban },
]

export default function HomePage() {
  const [email, setEmail] = useState("")
  const [url, setUrl] = useState("")
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<Category>("")
  const [items, setItems] = useState<Item[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState("")
  const [categories, setCategories] = useState(defaultCategories)
  const [newCategory, setNewCategory] = useState("")
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [editingDeadline, setEditingDeadline] = useState<string | null>(null)
  const [deadlineInput, setDeadlineInput] = useState("")
  const [recommendedPosts, setRecommendedPosts] = useState<Item[]>([])
  const dropdownRef = useRef<HTMLDivElement>(null)

  const router = useRouter()

  useEffect(() => {
    const savedEmail = localStorage.getItem('userEmail')
    if (!savedEmail) {
      router.push('/auth')
    } else {
      setEmail(savedEmail)
    }
  }, [router])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false)
      }
    }

    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [dropdownOpen])

  const handleSignOut = () => {
    localStorage.removeItem('userEmail')
    router.push('/auth')
  }

  async function fetchJson<T>(input: string, init?: RequestInit): Promise<T> {
    const response = await fetch(input, init)
    const raw = await response.text()

    let data: any = null
    try {
      data = raw ? JSON.parse(raw) : null
    } catch {
      data = null
    }

    if (!response.ok) {
      const fallback = raw?.trim() || `Request failed with status ${response.status}`
      throw new Error(data?.error || fallback)
    }

    if (data && data.success === false) {
      throw new Error(data.error || "Request failed")
    }

    if (data === null) {
      throw new Error("Server returned an unexpected response format")
    }

    return data as T
  }

  async function refreshDashboard(activeEmail = email, activeSearch = search, activeCategory = selectedCategory) {
    try {
      const itemsParams = new URLSearchParams()
      if (activeEmail.trim()) itemsParams.set("userEmail", activeEmail.trim())
      if (activeSearch.trim()) itemsParams.set("search", activeSearch.trim())
      if (activeCategory) itemsParams.set("category", activeCategory)

      const statsParams = new URLSearchParams()
      const notesParams = new URLSearchParams()
      if (activeEmail.trim()) {
        statsParams.set("userEmail", activeEmail.trim())
        notesParams.set("userEmail", activeEmail.trim())
      }

      // Fetch items
      const itemsRes = await fetchJson<{ items: Item[] }>(`${API_BASE}/items?${itemsParams.toString()}`)
      
      // Fetch stats
      let statsRes = { stats: null }
      try {
        statsRes = await fetchJson<{ stats: Stats }>(`${API_BASE}/dashboard/stats?${statsParams.toString()}`)
      } catch (error) {
        console.error('Error fetching stats:', error)
      }
      
      // Fetch notifications
      let notesRes = { notifications: [] }
      try {
        notesRes = await fetchJson<{ notifications: Notification[] }>(`${API_BASE}/notifications?${notesParams.toString()}`)
      } catch (error) {
        console.error('Error fetching notifications:', error)
      }

      const uniqueItems = Array.from(
        new Map(
          itemsRes.items.map((item) => [`${item.user_email || ""}__${item.primary_link || item.resource_url || item.source_url || ""}`, item])
        ).values()
      )

      // Additional deduplication by opportunity details to remove any remaining duplicates
      const finalItems = Array.from(
        new Map(
          uniqueItems.map((item) => [`${item.opportunity_title || item.summary || ""}__${item.organization_name || ""}__${item.category || ""}`, item])
        ).values()
      )

      setItems(finalItems)
      setStats(statsRes.stats)
      setNotifications(notesRes.notifications)
    } catch (error) {
      console.error('Error refreshing dashboard:', error)
      // Set empty data on error
      setItems([])
      setStats(null)
      setNotifications([])
    }
  }

  useEffect(() => {
    void refreshDashboard()
  }, [email, selectedCategory])

  const statCards = useMemo(() => {
    if (!stats) return []
    return [
      { label: "Tracked URLs", value: stats.total },
      { label: "Upcoming Deadlines", value: stats.deadlinesUpcoming },
      { label: "Overdue", value: stats.deadlinesOverdue },
      { label: "Internships", value: stats.byCategory["Internship"] || 0 },
      { label: "Courses", value: stats.byCategory["Course"] || 0 },
      { label: "Theory Concepts", value: stats.byCategory["Theory Concept"] || 0 },
    ]
  }, [stats])

  const formatLinkLabel = (href: string) => href.replace(/^https?:\/\//, "").replace(/\/+$/, "")

  function addCategory() {
    if (newCategory.trim() && !categories.some(c => c.value === newCategory.trim())) {
      const newCat = {
        value: newCategory.trim() as Category,
        label: newCategory.trim(),
        icon: FolderKanban
      }
      setCategories([...categories, newCat])
      setNewCategory("")
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const payloadUrl = url.trim()

    if (!email.trim() || !payloadUrl) {
      setMessage("Enter your email and one URL.")
      return
    }

    setLoading(true)
    setMessage("Processing your URL and extracting details...")

    try {
      window.localStorage.setItem("deadline_guard_email", email.trim())
      const response = await fetchJson<{ item?: Item; items?: Item[]; processedCount?: number; failedCount?: number; demoDeadlinesAssigned?: number }>(`${API_BASE}/ingest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userEmail: email.trim(),
          url: payloadUrl,
          categories: categories.map(c => c.value).filter(v => v !== ""),
        }),
      })
      setUrl("")
      const failed = response.failedCount ?? 0
      const assigned = response.demoDeadlinesAssigned ?? 0
      setMessage(
        assigned
          ? `Saved the post. Deadlines were added to 3 item cards and they are now visible in Upcoming Alerts.${failed ? ` Failed: ${failed}.` : ""}`
          : `Saved and classified the URL.${failed ? ` Failed: ${failed}.` : ""}`
      )
      await refreshDashboard(email)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to process URL")
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    try {
      await refreshDashboard(email, search, selectedCategory)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Search failed")
    }
  }

  async function handleSendEmails() {
    setSending(true)
    try {
      const response = await fetchJson<{ sentCount: number }>(`${API_BASE}/notifications/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userEmail: email.trim() || undefined }),
      })
      setMessage(`Deadline emails processed.`)
      await refreshDashboard()
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to send emails")
    } finally {
      setSending(false)
    }
  }

  async function handleUpdateDeadline(itemId: string, newDeadline: string) {
    try {
      await fetchJson(`${API_BASE}/items/${itemId}/deadline`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deadline: newDeadline || null }),
      })
      setEditingDeadline(null)
      setDeadlineInput("")
      await refreshDashboard()
      setMessage("Deadline updated successfully!")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update deadline")
    }
  }

  function startEditingDeadline(itemId: string, currentDeadline: string | null) {
    setEditingDeadline(itemId)
    setDeadlineInput(currentDeadline || "")
  }

  function cancelEditingDeadline() {
    setEditingDeadline(null)
    setDeadlineInput("")
  }

  // Generate recommendations based on user profile
  useEffect(() => {
    console.log('Recommendation effect triggered:', { email, itemsCount: items.length })

    if (email && items.length > 0) {
      const users = JSON.parse(localStorage.getItem('users') || '{}')
      const userData = users[email.toLowerCase()]
      const profile = userData?.profile

      console.log('User profile:', profile)

      if (profile && profile.interests && profile.interests.length > 0) {
        console.log('Filtering with interests:', profile.interests)
        // Filter items based on user interests
        const recommended = items.filter(item => {
          // Check if item category matches user interests
          const categoryMatch = profile.interests.some((interest: string) =>
            item.category.toLowerCase().includes(interest.toLowerCase()) ||
            interest.toLowerCase().includes(item.category.toLowerCase())
          )

          // Check if keywords match user interests
          const keywordMatch = profile.interests.some((interest: string) =>
            item.keywords.some((keyword: string) =>
              keyword.toLowerCase().includes(interest.toLowerCase()) ||
              interest.toLowerCase().includes(keyword.toLowerCase())
            )
          )

          // Check field/profession relevance
          const fieldMatch = profile.fieldOfStudy && (
            item.summary.toLowerCase().includes(profile.fieldOfStudy.toLowerCase()) ||
            item.keywords.some((keyword: string) =>
              keyword.toLowerCase().includes(profile.fieldOfStudy.toLowerCase())
            )
          )

          const professionMatch = profile.profession && (
            item.summary.toLowerCase().includes(profile.profession.toLowerCase()) ||
            item.keywords.some((keyword: string) =>
              keyword.toLowerCase().includes(profile.profession.toLowerCase())
            )
          )

          const matches = categoryMatch || keywordMatch || fieldMatch || professionMatch
          if (matches) {
            console.log('Item matched:', item.opportunity_title, { categoryMatch, keywordMatch, fieldMatch, professionMatch })
          }

          return matches
        })

        console.log('Recommended items found:', recommended.length)

        // Limit to 6 recommendations and randomize order slightly
        const shuffled = recommended.sort(() => 0.5 - Math.random())
        setRecommendedPosts(shuffled.slice(0, 6))
      } else {
        console.log('No profile or interests found, showing general recommendations')
        // If no profile, show some general recommendations
        const shuffled = items.sort(() => 0.5 - Math.random())
        setRecommendedPosts(shuffled.slice(0, 4))
      }
    } else {
      console.log('No email or items, clearing recommendations')
      setRecommendedPosts([])
    }
  }, [email, items])

  return (
    <main className="paper-backdrop min-h-screen text-slate-900 relative">
      <div className="fixed top-4 right-4 z-50">
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-center w-10 h-10 rounded-full bg-white border border-slate-200 shadow-lg hover:shadow-xl transition-shadow"
          >
            <User className="w-5 h-5 text-slate-600" />
          </button>
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-10">
              <div className="p-4 border-b border-slate-200">
                <p className="text-sm font-medium text-slate-900">Signed in as</p>
                <p className="text-sm text-slate-600 truncate">{email}</p>
              </div>
              <div className="p-2">
                <button
                  onClick={() => router.push('/profile')}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Profile Settings
                </button>
                <button
                  onClick={handleSignOut}
                  className="w-full text-left px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="mx-auto grid min-h-screen max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[280px_1fr]">
        <aside className="fade-rise rounded-[28px] border border-slate-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.94)_0%,_rgba(244,248,252,0.96)_68%,_rgba(236,242,249,0.98)_100%)] p-5 text-slate-900 shadow-xl shadow-slate-200/80 backdrop-blur-xl">
          <div className="mb-6">
            <h1 className="mt-3 text-3xl font-bold tracking-tight">Link Ledger</h1>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              One memory palace for saved reels and posts. No more missed internship and course deadlines.
            </p>
          </div>

          <div className="space-y-2">
            {categories.map(({ value, label, icon: Icon }) => (
              <button
                key={label}
                type="button"
                onClick={() => setSelectedCategory(value)}
                className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm transition ${
                  selectedCategory === value
                    ? "bg-[linear-gradient(90deg,_rgba(10,102,194,0.12),_rgba(225,48,108,0.1),_rgba(253,29,29,0.08))] text-[#0A66C2] shadow-md shadow-pink-100/40"
                    : "bg-white/70 text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[linear-gradient(135deg,#833ab4,#fd1d1d,#fcb045)] p-[1.5px] shadow-md shadow-pink-200/60">
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-white text-[#0A66C2]">
                    <Icon className="h-4 w-4" />
                  </span>
                </span>
                <span>{label}</span>
              </button>
            ))}
            <div className="mt-4 space-y-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="New category name"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
              />
              <button
                onClick={addCategory}
                className="w-full rounded-lg bg-[#1877F2] px-3 py-2 text-sm font-medium text-white shadow-md shadow-blue-200 transition hover:bg-[#0A66C2]"
              >
                Add Category
              </button>
            </div>
          </div>
        </aside>

        <section className="space-y-3">
          <div className="fade-rise rounded-[30px] border border-white/70 bg-[linear-gradient(135deg,_rgba(10,102,194,0.95),_rgba(66,103,178,0.9),_rgba(225,48,108,0.84),_rgba(252,176,69,0.8))] p-6 shadow-xl shadow-blue-200/60 backdrop-blur-xl">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-white/18 px-3 py-1 text-xs uppercase tracking-[0.2em] text-white shadow-lg backdrop-blur-sm">
                  <Compass className="h-3.5 w-3.5" />
                  Organized Opportunity Radar
                </p>
                <h2 className="mt-4 text-3xl font-bold text-white">From scattered saved posts to action-ready opportunities</h2>
                <p className="mt-3 max-w-3xl text-base leading-7 text-white/88">
                  Paste social and web links, extract the key information with your Scrapper-Agent, then classify into internships,
                  courses, AI tools, and theory topics with searchable metadata.
                </p>
              </div>
            </div>
          </div>

          <div className="fade-rise rounded-2xl border border-slate-200 bg-white/82 backdrop-blur-xl p-4 shadow-lg shadow-slate-200/70">
            <form onSubmit={handleSearch} className="flex gap-3">
              <Input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search keyword, organization, topic..."
                className="flex-1"
              />
              <Button type="submit" className="border-0 bg-[linear-gradient(90deg,#0A66C2,#1877F2,#E1306C)] text-white shadow-md shadow-blue-200 transition hover:opacity-95">
                <Search className="h-4 w-4" />
                Search
              </Button>
            </form>
          </div>

          <div className={`grid gap-6 ${selectedCategory === "" ? "xl:grid-cols-[1.15fr_0.85fr]" : "grid-cols-1"}`}>
            {selectedCategory === "" ? (
              <Card className="fade-rise overflow-hidden border-slate-200 bg-white/88 backdrop-blur-xl shadow-lg shadow-slate-200/70 max-h-96">
                <CardHeader className="pb-3">
                  <CardTitle className="text-2xl">Ingest Links</CardTitle>
                  <CardDescription className="text-slate-600">
                    Add your email to receive reminders, then paste one post link to extract and classify it.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-0">
                  <form onSubmit={handleSubmit} className="grid gap-3">
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email for deadline reminders</Label>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="url">Single URL</Label>
                      <Input
                        id="url"
                        type="url"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        placeholder="https://www.linkedin.com/..."
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button type="submit" disabled={loading} className="border-0 bg-[linear-gradient(90deg,#0A66C2,#1877F2,#E1306C)] text-white shadow-md shadow-blue-200 transition hover:opacity-95">
                        {loading ? "Processing..." : "Extract + Classify"}
                      </Button>
                    </div>
                  </form>
                  {message ? (
                    <p className="mt-4 rounded-2xl bg-[linear-gradient(90deg,#0A66C2,#4267B2,#833AB4)] px-4 py-3 text-sm text-white shadow-lg shadow-blue-200/60">{message}</p>
                  ) : null}
                </CardContent>
              </Card>
            ) : (
              <Card className="fade-rise overflow-hidden border-slate-200 bg-white/88 backdrop-blur-xl shadow-lg shadow-slate-200/70">
                <CardHeader>
                  <CardTitle className="text-2xl">{categories.find((c) => c.value === selectedCategory)?.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  {message ? (
                    <p className="mt-4 rounded-2xl bg-[linear-gradient(90deg,#0A66C2,#4267B2,#833AB4)] px-4 py-3 text-sm text-white shadow-lg shadow-blue-200/60">{message}</p>
                  ) : null}
                </CardContent>
              </Card>
            )}

            {selectedCategory === "" && (
              <Card className="fade-rise border border-white/60 bg-[linear-gradient(180deg,_rgba(255,255,255,0.18),_rgba(255,255,255,0.08)),linear-gradient(180deg,_rgba(24,119,242,0.94),_rgba(66,103,178,0.92),_rgba(131,58,180,0.86),_rgba(225,48,108,0.78))] text-white shadow-xl shadow-blue-200/70 backdrop-blur-xl">
                <CardHeader>
                  <CardTitle className="text-2xl">Remainder Hub</CardTitle>
                  <CardDescription className="text-white/84">
                    Search by keyword, company, topic, summary, and send reminder emails instantly.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-5">
                  <div className="grid gap-2">
                    <Label htmlFor="quick-email" className="text-white">Email for reminders</Label>
                    <Input
                      id="quick-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="border-white/25 bg-white/14 text-white placeholder:text-white/70"
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    {statCards.map((card, index) => (
                      <div
                        key={card.label}
                        className="rounded-2xl bg-white/15 p-4 ring-1 ring-white/18 backdrop-blur-sm"
                        style={{ animationDelay: `${index * 50}ms` }}
                      >
                        <p className="text-sm text-white/80">{card.label}</p>
                        <p className="mt-2 text-3xl font-semibold">{card.value}</p>
                      </div>
                    ))}
                  </div>

                  <Button
                    type="button"
                    onClick={handleSendEmails}
                    disabled={sending}
                    className="w-full bg-white text-[#0A66C2] shadow-md shadow-white/30 transition hover:bg-slate-50"
                  >
                    <Bell className="h-4 w-4" />
                    {sending ? "Sending..." : "Send Deadline Emails Now"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>

          <div className={`grid gap-6 ${selectedCategory === "" ? "xl:grid-cols-[1.2fr_0.8fr]" : "grid-cols-1"}`}>
            <Card className="fade-rise border-slate-200 bg-white/88 backdrop-blur-xl shadow-lg shadow-slate-200/70">
              <CardHeader>
                <CardTitle>Classified Link Ledger</CardTitle>
                <CardDescription className="text-slate-600">
                  Your saved posts are organized into clear, searchable opportunity cards.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-500">
                    {email.trim()
                      ? "No matching items for this email yet. Try clearing the email field to view all saved items."
                      : "No saved items yet. Add your first URL to populate the dashboard."}
                  </div>
                ) : selectedCategory === "" ? (
                  <div className="grid grid-cols-2 gap-4">
                    {items.map((item, index) => (
                      <article
                        key={item.id}
                        className="fade-rise rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(247,250,252,0.98))] p-4 shadow-lg shadow-slate-200/60"
                        style={{ animationDelay: `${index * 60}ms` }}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.25em] text-[#4267B2]">{item.platform}</p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-900">
                              {item.opportunity_title || `${item.organization_name} - ${item.category}`}
                            </h3>
                            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                              {item.organization_name} - {item.category}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div
                              className={`rounded-full px-3 py-1 text-xs font-medium ${
                                item.deadline_status === "upcoming"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : item.deadline_status === "overdue"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {editingDeadline === item.id ? (
                                <div className="flex items-center gap-2">
                                  <input
                                    type="date"
                                    value={deadlineInput}
                                    onChange={(e) => setDeadlineInput(e.target.value)}
                                    className="text-xs bg-transparent border-none outline-none w-24"
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => handleUpdateDeadline(item.id, deadlineInput)}
                                    className="text-green-600 hover:text-green-800"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={cancelEditingDeadline}
                                    className="text-red-600 hover:text-red-800"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span>{item.deadline ? `Deadline: ${item.deadline}` : "No deadline found"}</span>
                                  <button
                                    onClick={() => startEditingDeadline(item.id, item.deadline)}
                                    className="text-slate-500 hover:text-slate-700 opacity-60 hover:opacity-100"
                                  >
                                    <Edit className="h-3 w-3" />
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>

                        {item.concept_topic ? (
                          <p className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-[#E1306C]">
                            Topic: {item.concept_topic}
                          </p>
                        ) : null}

                        <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
                          <a
                            href={item.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-slate-500 hover:text-[#0A66C2]"
                          >
                            View original post
                          </a>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-4">
                    {items.map((item, index) => (
                      <article
                        key={item.id}
                        className="fade-rise rounded-2xl border border-slate-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(247,250,252,0.98))] p-3 shadow-lg shadow-slate-200/60"
                        style={{ animationDelay: `${index * 60}ms` }}
                      >
                        <p className="text-lg font-semibold text-slate-900">
                          {item.opportunity_title || `${item.organization_name} - ${item.category}`} - <a
                            href={item.source_url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-lg text-slate-500 hover:text-[#0A66C2]"
                          >
                            View original post
                          </a>
                        </p>
                      </article>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedCategory === "" && (
              <Card className="fade-rise border-slate-200 bg-white/88 backdrop-blur-xl shadow-lg shadow-slate-200/70">
                <CardHeader>
                  <CardTitle>Upcoming Alerts</CardTitle>
                  <CardDescription className="text-slate-600">Near-deadline items are highlighted here to reduce missed opportunities.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {notifications.length === 0 ? (
                    <div className="rounded-3xl bg-slate-50 p-6 text-sm text-slate-500 ring-1 ring-slate-200">No upcoming deadline alerts right now.</div>
                  ) : (
                    notifications.map((note, index) => (
                      <div
                        key={note.id}
                        className="fade-rise rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(247,250,252,0.98))] p-4 shadow-lg shadow-slate-200/60"
                        style={{ animationDelay: `${index * 60}ms` }}
                      >
                        <p className="font-medium text-slate-900">{note.message}</p>
                        <p className="mt-2 text-sm text-slate-500">{note.deadline || "No date"}</p>
                        <a
                          href={note.primary_link}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-3 inline-flex items-center gap-2 text-sm font-medium text-[#0A66C2] hover:text-[#E1306C]"
                        >
                          Open link
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            )}

            {/* Recommended Posts Section */}
            {(() => {
              console.log('Render check:', {
                selectedCategory,
                recommendedPostsLength: recommendedPosts.length,
                showRecommendations: selectedCategory === "" && recommendedPosts.length > 0
              })
              return selectedCategory === "" && recommendedPosts.length > 0 && (
                <Card className="fade-rise border-slate-200 bg-white/88 backdrop-blur-xl shadow-lg shadow-slate-200/70">
                  <CardHeader>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Sparkles className="h-6 w-6 text-purple-600" />
                      Recommended Posts for You
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Personalized suggestions based on your profile and interests
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      {recommendedPosts.map((item, index) => (
                        <article
                          key={`rec-${item.id}`}
                          className="fade-rise rounded-3xl border border-slate-200 bg-[linear-gradient(180deg,_rgba(255,255,255,0.96),_rgba(247,250,252,0.98))] p-4 shadow-lg shadow-slate-200/60"
                          style={{ animationDelay: `${index * 80}ms` }}
                        >
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div>
                              <p className="text-xs uppercase tracking-[0.25em] text-[#4267B2]">{item.platform}</p>
                              <h3 className="mt-2 text-lg font-semibold text-slate-900">
                                {item.opportunity_title || `${item.organization_name} - ${item.category}`}
                              </h3>
                              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-500">
                                {item.organization_name} - {item.category}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <div
                                className={`rounded-full px-3 py-1 text-xs font-medium ${
                                  item.deadline_status === "upcoming"
                                    ? "bg-emerald-100 text-emerald-700"
                                    : item.deadline_status === "overdue"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-amber-100 text-amber-700"
                                }`}
                              >
                                {editingDeadline === item.id ? (
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="date"
                                      value={deadlineInput}
                                      onChange={(e) => setDeadlineInput(e.target.value)}
                                      className="text-xs bg-transparent border-none outline-none w-24"
                                      autoFocus
                                    />
                                    <button
                                      onClick={() => handleUpdateDeadline(item.id, deadlineInput)}
                                      className="text-green-600 hover:text-green-800"
                                    >
                                      ✓
                                    </button>
                                    <button
                                      onClick={cancelEditingDeadline}
                                      className="text-red-600 hover:text-red-800"
                                    >
                                      ✕
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span>{item.deadline ? `Deadline: ${item.deadline}` : "No deadline found"}</span>
                                    <button
                                      onClick={() => startEditingDeadline(item.id, item.deadline)}
                                      className="text-slate-500 hover:text-slate-700 opacity-60 hover:opacity-100"
                                    >
                                      <Edit className="h-3 w-3" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {item.concept_topic ? (
                            <p className="mt-3 text-xs font-medium uppercase tracking-[0.2em] text-[#E1306C]">
                              Topic: {item.concept_topic}
                            </p>
                          ) : null}

                          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm">
                            <a
                              href={item.source_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-slate-500 hover:text-[#0A66C2]"
                            >
                              View original post
                            </a>
                          </div>
                        </article>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )
            })()}
          </div>
        </section>
      </div>
    </main>
  )
}
