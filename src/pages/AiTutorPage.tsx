import { Bot, Plus, Send, Trash2, User } from 'lucide-react'
import { useEffect, useRef, useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { PageHeader } from '@/components/ui/PageHeader'
import { Spinner } from '@/components/ui/Spinner'
import { Textarea } from '@/components/ui/Textarea'
import { useAuth } from '@/hooks/useAuth'
import { useToast } from '@/hooks/useToast'
import { cn } from '@/lib/cn'
import { getErrorMessage } from '@/lib/errors'
import {
  askTutor,
  createConversation,
  deleteConversation,
  listConversations,
  listMessages,
  saveMessage,
  type ChatTurn,
} from '@/services/ai'
import type { AiConversation } from '@/types/models'

const SUGGESTIONS = [
  'Explain time complexity with examples',
  'What is normalisation in databases?',
  'Summarise the OSI model layer by layer',
  'Give me 5 revision tips for calculus',
]

export function AiTutorPage() {
  const { user } = useAuth()
  const toast = useToast()

  const [conversations, setConversations] = useState<AiConversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [turns, setTurns] = useState<ChatTurn[]>([])
  const [input, setInput] = useState('')
  const [sending, setSending] = useState(false)
  const [loadingThread, setLoadingThread] = useState(false)
  const [pendingDelete, setPendingDelete] = useState<AiConversation | null>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    listConversations()
      .then(setConversations)
      .catch((error) => toast.error('Could not load conversations', getErrorMessage(error)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [turns, sending])

  async function openConversation(conversation: AiConversation) {
    setActiveId(conversation.id)
    setLoadingThread(true)
    try {
      const messages = await listMessages(conversation.id)
      setTurns(messages.map((message) => ({ role: message.role, content: message.content })))
    } catch (error) {
      toast.error('Could not load this conversation', getErrorMessage(error))
    } finally {
      setLoadingThread(false)
    }
  }

  function startNew() {
    setActiveId(null)
    setTurns([])
    setInput('')
  }

  async function handleSend(event: FormEvent) {
    event.preventDefault()
    const question = input.trim()
    if (!question || !user || sending) return

    const nextTurns: ChatTurn[] = [...turns, { role: 'user', content: question }]
    setTurns(nextTurns)
    setInput('')
    setSending(true)

    try {
      let conversationId = activeId
      if (!conversationId) {
        const conversation = await createConversation(question, user.id)
        conversationId = conversation.id
        setActiveId(conversation.id)
        setConversations((current) => [conversation, ...current])
      }

      await saveMessage({ conversationId, userId: user.id, role: 'user', content: question })
      const answer = await askTutor(nextTurns)
      setTurns((current) => [...current, { role: 'assistant', content: answer }])
      await saveMessage({ conversationId, userId: user.id, role: 'assistant', content: answer })
    } catch (error) {
      toast.error('The tutor could not answer', getErrorMessage(error))
      setTurns((current) => current.slice(0, -1))
      setInput(question)
    } finally {
      setSending(false)
    }
  }

  async function handleDelete() {
    if (!pendingDelete) return
    try {
      await deleteConversation(pendingDelete.id)
      setConversations((current) => current.filter((item) => item.id !== pendingDelete.id))
      if (activeId === pendingDelete.id) startNew()
      toast.success('Conversation deleted')
    } catch (error) {
      toast.error('Could not delete the conversation', getErrorMessage(error))
    } finally {
      setPendingDelete(null)
    }
  }

  return (
    <>
      <PageHeader
        title="AI tutor"
        description="Ask anything about your coursework. Answers come from a secure server-side function."
        actions={
          <Button variant="outline" onClick={startNew}>
            <Plus className="h-4 w-4" /> New chat
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[16rem_1fr]">
        <aside className="card hidden max-h-[70vh] overflow-y-auto lg:block">
          <h2 className="border-b border-slate-200 px-4 py-3 text-sm font-semibold text-slate-900 dark:border-slate-800 dark:text-slate-100">
            Conversations
          </h2>
          {conversations.length === 0 ? (
            <p className="px-4 py-6 text-sm text-slate-500 dark:text-slate-400">
              Your chats will be listed here.
            </p>
          ) : (
            <ul className="p-2">
              {conversations.map((conversation) => (
                <li key={conversation.id} className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openConversation(conversation)}
                    className={cn(
                      'min-w-0 flex-1 truncate rounded-lg px-3 py-2 text-left text-sm',
                      activeId === conversation.id
                        ? 'bg-brand-50 font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-200'
                        : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                    )}
                  >
                    {conversation.title}
                  </button>
                  <button
                    type="button"
                    aria-label={`Delete ${conversation.title}`}
                    onClick={() => setPendingDelete(conversation)}
                    className="rounded p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        <section className="card flex h-[70vh] flex-col">
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {loadingThread && (
              <div className="flex justify-center py-6">
                <Spinner className="h-6 w-6 text-brand-600" />
              </div>
            )}

            {!loadingThread && turns.length === 0 && (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                <span className="rounded-full bg-brand-50 p-3 text-brand-600 dark:bg-brand-900/40 dark:text-brand-200">
                  <Bot className="h-6 w-6" />
                </span>
                <div>
                  <h2 className="font-semibold text-slate-900 dark:text-slate-100">
                    What are we studying today?
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Ask a question, or start with one of these.
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => setInput(suggestion)}
                      className="rounded-full border border-slate-300 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {turns.map((turn, index) => (
              <div
                key={index}
                className={cn('flex gap-3', turn.role === 'user' ? 'justify-end' : 'justify-start')}
              >
                {turn.role === 'assistant' && (
                  <span className="mt-1 h-7 w-7 shrink-0 rounded-full bg-brand-50 p-1.5 text-brand-600 dark:bg-brand-900/40 dark:text-brand-200">
                    <Bot className="h-4 w-4" />
                  </span>
                )}
                <div
                  className={cn(
                    'max-w-[85%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm',
                    turn.role === 'user'
                      ? 'rounded-br-sm bg-brand-600 text-white'
                      : 'rounded-bl-sm bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-100',
                  )}
                >
                  {turn.content}
                </div>
                {turn.role === 'user' && (
                  <span className="mt-1 h-7 w-7 shrink-0 rounded-full bg-slate-100 p-1.5 text-slate-500 dark:bg-slate-800 dark:text-slate-300">
                    <User className="h-4 w-4" />
                  </span>
                )}
              </div>
            ))}

            {sending && (
              <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                <Spinner className="h-4 w-4" /> Thinking...
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={handleSend}
            className="flex items-end gap-2 border-t border-slate-200 p-3 dark:border-slate-800"
          >
            <Textarea
              aria-label="Message the AI tutor"
              rows={2}
              placeholder="Ask about a topic, assignment or exam..."
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault()
                  void handleSend(event)
                }
              }}
            />
            <Button type="submit" size="icon" aria-label="Send message" loading={sending}>
              {!sending && <Send className="h-4 w-4" />}
            </Button>
          </form>
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete conversation"
        message="This conversation and its messages will be permanently deleted."
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </>
  )
}
