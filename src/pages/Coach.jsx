import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Send, Loader2, Sparkles, Plus, MessagesSquare,
  Trash2, AlertTriangle,
} from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import Avatar from '../components/Avatar';
import LoadingSkeleton from '../components/LoadingSkeleton';
import { useToast } from '../components/useToast';
import './Coach.css';

const STARTER_PROMPTS = [
  "On a souvent les mêmes disputes au sujet du ménage. Comment l'aborder sans escalade ?",
  "On parle de plus en plus de fonder une famille mais on n'est pas alignés. Par où commencer ?",
  "Je me sens moins compris·e ces temps-ci. Comment lui en parler ?",
  "Comment retrouver de la complicité quand on est très pris par le quotidien ?",
];

export default function Coach() {
  const { conversationId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();

  const [status, setStatus] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const messagesRef = useRef(null);
  const textareaRef = useRef(null);

  useEffect(() => {
    document.title = 'Coach IA — CoupleMatch';
    return () => { document.title = 'CoupleMatch'; };
  }, []);

  const loadList = useCallback(async () => {
    try {
      const [statusRes, listRes] = await Promise.all([
        api.get('/coach/status'),
        api.get('/coach/conversations'),
      ]);
      if (statusRes.data?.success) setStatus(statusRes.data.data);
      if (listRes.data?.success) setConversations(listRes.data.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadList(); }, [loadList]);

  // Charger la conversation active
  useEffect(() => {
    if (!conversationId) { setActive(null); return; }
    let cancelled = false;
    api.get(`/coach/conversations/${conversationId}`)
      .then((r) => {
        if (!cancelled && r.data?.success) setActive(r.data.data);
      })
      .catch(() => { if (!cancelled) navigate('/app/coach', { replace: true }); });
    return () => { cancelled = true; };
  }, [conversationId, navigate]);

  // Auto-scroll bas
  useEffect(() => {
    if (!messagesRef.current) return;
    messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
  }, [active?.messages?.length, sending]);

  async function startConversation(prefill = '') {
    setCreating(true);
    try {
      const { data } = await api.post('/coach/conversations');
      if (data?.success) {
        const newConv = data.data;
        setConversations((prev) => [{ ...newConv, messages_count: 0 }, ...prev]);
        navigate(`/app/coach/${newConv.id}`);
        if (prefill) setDraft(prefill);
        setTimeout(() => textareaRef.current?.focus(), 100);
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Impossible de démarrer la conversation');
    } finally {
      setCreating(false);
    }
  }

  async function sendMessage(e) {
    e?.preventDefault?.();
    const content = draft.trim();
    if (!content || !active) return;
    setSending(true);

    // Optimiste : message user immédiat
    const tempId = `temp-${Date.now()}`;
    const optimisticUser = {
      id: tempId,
      role: 'user',
      content,
      user_id: user?.id,
      user_name: user?.name,
      created_at: new Date().toISOString(),
    };
    setActive((prev) => ({ ...prev, messages: [...(prev?.messages || []), optimisticUser] }));
    setDraft('');

    try {
      const { data } = await api.post(`/coach/conversations/${active.id}/messages`, { content });
      if (data?.success) {
        setActive((prev) => {
          const withoutTemp = (prev.messages || []).filter((m) => m.id !== tempId);
          return {
            ...prev,
            title: data.data.conversation.title,
            messages: [...withoutTemp, data.data.user_message, data.data.assistant_message],
          };
        });
        // Mettre à jour la liste latérale
        setConversations((prev) => {
          const map = new Map(prev.map((c) => [c.id, c]));
          map.set(active.id, {
            ...(map.get(active.id) || {}),
            id: active.id,
            title: data.data.conversation.title,
            messages_count: ((map.get(active.id)?.messages_count) || 0) + 2,
            updated_at: data.data.conversation.updated_at,
          });
          return Array.from(map.values()).sort((a, b) =>
            new Date(b.updated_at || 0) - new Date(a.updated_at || 0)
          );
        });
      }
    } catch (e) {
      toast.error(e.response?.data?.message || 'Erreur lors de l\'envoi');
      // Retirer le message optimiste
      setActive((prev) => ({ ...prev, messages: (prev?.messages || []).filter((m) => m.id !== tempId) }));
    } finally {
      setSending(false);
    }
  }

  async function deleteConversation(id) {
    if (!window.confirm('Supprimer cette conversation ?')) return;
    try {
      await api.delete(`/coach/conversations/${id}`);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (active?.id === id) navigate('/app/coach');
      toast.success('Conversation supprimée');
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  }

  function onTextareaKeyDown(e) {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      sendMessage();
    }
  }

  if (loading) {
    return (
      <div className="coach">
        <LoadingSkeleton />
      </div>
    );
  }

  return (
    <div className="coach">
      <header className="coach-head">
        <Link to="/app" className="coach-back"><ArrowLeft size={14} /> Tableau de bord</Link>
        <h1 className="display coach-title"><em>Coach</em> IA</h1>
        <p className="coach-sub">
          Un échange privé pour parler de ce qui vous travaille à deux. Le coach connaît votre dernier résultat de compatibilité.
        </p>
        {status && !status.configured && (
          <div className="coach-warn">
            <AlertTriangle size={14} />
            <span>Le coach IA n'est pas encore configuré côté serveur. Définissez <code>ANTHROPIC_API_KEY</code> dans le <code>.env</code> du backend pour l'activer.</span>
          </div>
        )}
      </header>

      <div className="coach-layout">
        {/* Sidebar conversations */}
        <aside className="coach-sidebar">
          <button
            type="button"
            className="btn btn-primary coach-new"
            onClick={() => startConversation()}
            disabled={creating}
          >
            {creating ? <Loader2 size={16} className="spin" /> : <Plus size={16} />}
            Nouvelle conversation
          </button>
          {conversations.length === 0 ? (
            <p className="coach-sidebar__empty">Aucune conversation pour l'instant.</p>
          ) : (
            <ul className="coach-sidebar__list">
              {conversations.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/app/coach/${c.id}`}
                    className={`coach-conv ${String(active?.id) === String(c.id) ? 'is-active' : ''}`}
                  >
                    <span className="coach-conv__title">{c.title || 'Nouvelle conversation'}</span>
                    <span className="coach-conv__meta">
                      {c.messages_count || 0} messages · {c.updated_at ? new Date(c.updated_at).toLocaleDateString('fr-FR') : ''}
                    </span>
                  </Link>
                  <button
                    type="button"
                    className="coach-conv__delete"
                    onClick={() => deleteConversation(c.id)}
                    aria-label="Supprimer"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </aside>

        {/* Main */}
        <section className="coach-main">
          {!active ? (
            <div className="coach-empty">
              <span className="coach-empty__icon"><MessagesSquare size={32} /></span>
              <h2>De quoi avez-vous envie de parler&nbsp;?</h2>
              <p>Choisissez une question pour démarrer, ou écrivez la vôtre.</p>
              <div className="coach-starters">
                {STARTER_PROMPTS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    className="coach-starter"
                    onClick={() => startConversation(p)}
                    disabled={creating}
                  >
                    <Sparkles size={14} />
                    <span>{p}</span>
                  </button>
                ))}
              </div>
              <button
                type="button"
                className="btn btn-outline"
                onClick={() => startConversation()}
                disabled={creating}
              >
                <Plus size={16} /> Démarrer une conversation vide
              </button>
            </div>
          ) : (
            <>
              <div className="coach-messages" ref={messagesRef}>
                {active.messages?.length === 0 && (
                  <div className="coach-onboard">
                    <p>Posez votre première question. Le coach répondra en s'appuyant sur votre couple.</p>
                  </div>
                )}
                <AnimatePresence initial={false}>
                  {(active.messages || []).map((m) => (
                    <motion.div
                      key={m.id}
                      className={`coach-msg coach-msg--${m.role}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <div className="coach-msg__avatar">
                        {m.role === 'user'
                          ? <Avatar name={m.user_name || user?.name} size={32} variant="a" />
                          : <span className="coach-msg__bot"><Sparkles size={14} /></span>}
                      </div>
                      <div className="coach-msg__bubble">
                        <p className="coach-msg__name">
                          {m.role === 'user' ? (m.user_name || 'Vous') : 'Coach'}
                        </p>
                        {m.content.split('\n\n').map((para, i) => (
                          <p key={i}>{para}</p>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                {sending && (
                  <motion.div
                    className="coach-msg coach-msg--assistant coach-typing"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <div className="coach-msg__avatar">
                      <span className="coach-msg__bot"><Sparkles size={14} /></span>
                    </div>
                    <div className="coach-msg__bubble">
                      <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                    </div>
                  </motion.div>
                )}
              </div>

              <form onSubmit={sendMessage} className="coach-composer">
                <textarea
                  ref={textareaRef}
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={onTextareaKeyDown}
                  placeholder="Écrivez votre message…"
                  rows={2}
                  maxLength={4000}
                  disabled={sending}
                />
                <button
                  type="submit"
                  className="btn btn-primary coach-send"
                  disabled={sending || !draft.trim()}
                  aria-label="Envoyer"
                >
                  {sending ? <Loader2 size={16} className="spin" /> : <Send size={16} />}
                </button>
              </form>
              <p className="coach-hint">⌘/Ctrl + Entrée pour envoyer · Le coach n'est pas un thérapeute. En cas d'urgence, contactez un professionnel.</p>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
