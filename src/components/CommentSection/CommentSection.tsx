import { useEffect, useMemo, useRef, useState } from "react";
import { useStateContext } from "../../context";
import CustomButton from "../CustomButton/CustomButton";
import AuthModal from "../AuthModal/AuthModal";
import "./CommentSection.css";

type CommentSectionProps = {
  pId: string;
  ownerUid?: string;
  ownerName?: string;
  ownerPhotoURL?: string | null;
};

type TaggableUser = {
  uid: string;
  name: string;
  photoURL: string | null;
};

type MentionState = {
  which: "new" | "reply" | "edit";
  start: number;
  query: string;
};

const timeAgo = (millis: number) => {
  const seconds = Math.floor((Date.now() - millis) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(millis).toLocaleDateString();
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Finds an in-progress "@query" token right before the cursor — an @ that
// starts at a word boundary and has no whitespace between it and the
// cursor (i.e. the user is actively typing a mention, not just referencing
// an old one earlier in the text).
const findMentionToken = (value: string, cursor: number) => {
  const upToCursor = value.slice(0, cursor);
  const match = upToCursor.match(/(?:^|\s)@([^\s@]*)$/);
  if (!match) return null;
  const start = upToCursor.length - match[0].length + (match[0].startsWith("@") ? 0 : 1);
  return { start, query: match[1] };
};

const CommentSection = ({
  pId,
  ownerUid,
  ownerName,
  ownerPhotoURL,
}: CommentSectionProps) => {
  const {
    address,
    userName,
    isAdmin,
    postComment,
    getComments,
    updateComment,
    deleteComment,
    toggleCommentLike,
  }: any = useStateContext();

  const [comments, setComments] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [isPosting, setIsPosting] = useState(false);
  const [error, setError] = useState("");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [mention, setMention] = useState<MentionState | null>(null);

  const newTextareaRef = useRef<HTMLTextAreaElement>(null);
  const replyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const editTextareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchComments = async () => {
    const data = await getComments(pId);
    setComments(data);
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pId]);

  const taggableUsers = useMemo<TaggableUser[]>(() => {
    const map = new Map<string, TaggableUser>();
    if (ownerUid && ownerName) {
      map.set(ownerUid, {
        uid: ownerUid,
        name: ownerName,
        photoURL: ownerPhotoURL ?? null,
      });
    }
    comments.forEach((c) => {
      map.set(c.authorUid, {
        uid: c.authorUid,
        name: c.authorName,
        photoURL: c.authorPhotoURL,
      });
    });
    if (address) map.delete(address);
    return Array.from(map.values());
  }, [comments, ownerUid, ownerName, ownerPhotoURL, address]);

  const mentionRegex = useMemo(() => {
    if (taggableUsers.length === 0) return null;
    const names = taggableUsers
      .map((u) => u.name)
      .sort((a, b) => b.length - a.length)
      .map(escapeRegExp);
    return new RegExp(`@(${names.join("|")})`, "g");
  }, [taggableUsers]);

  const renderWithMentions = (value: string) => {
    if (!mentionRegex) return value;
    const parts = value.split(mentionRegex);
    return parts.map((part, i) =>
      i % 2 === 1 ? (
        <span className="comment-mention" key={i}>
          @{part}
        </span>
      ) : (
        part
      ),
    );
  };

  const mentionSuggestions = useMemo(() => {
    if (!mention) return [];
    const q = mention.query.toLowerCase();
    return taggableUsers.filter((u) => u.name.toLowerCase().startsWith(q));
  }, [mention, taggableUsers]);

  const handleComposeChange = (
    which: "new" | "reply" | "edit",
    value: string,
    cursor: number,
  ) => {
    if (which === "new") setText(value);
    else if (which === "reply") setReplyText(value);
    else setEditText(value);

    const token = findMentionToken(value, cursor);
    setMention(token ? { which, start: token.start, query: token.query } : null);
  };

  const applyMention = (user: TaggableUser) => {
    if (!mention) return;

    const refMap = { new: newTextareaRef, reply: replyTextareaRef, edit: editTextareaRef };
    const setterMap = { new: setText, reply: setReplyText, edit: setEditText };
    const current = { new: text, reply: replyText, edit: editText }[mention.which];

    const cursor = refMap[mention.which].current?.selectionStart ?? current.length;
    const before = current.slice(0, mention.start);
    const after = current.slice(cursor);
    const next = `${before}@${user.name} ${after}`;

    setterMap[mention.which](next);
    setMention(null);

    requestAnimationFrame(() => {
      const el = refMap[mention.which].current;
      if (el) {
        const pos = before.length + user.name.length + 2;
        el.focus();
        el.setSelectionRange(pos, pos);
      }
    });
  };

  const topLevel = comments.filter((c) => !c.parentId);
  const repliesFor = (id: string) =>
    comments.filter((c) => c.parentId === id);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsPosting(true);
    setError("");
    try {
      await postComment(pId, text);
      setText("");
      await fetchComments();
    } catch (err: any) {
      setError(err?.message ?? "Could not post comment. Please try again.");
    } finally {
      setIsPosting(false);
    }
  };

  const handleReplyClick = (comment: any) => {
    const rootId = comment.parentId ?? comment.id;
    setReplyingTo(rootId);
    setReplyText(comment.parentId ? `@${comment.authorName} ` : "");
    setMention(null);
  };

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !replyingTo) return;

    try {
      await postComment(pId, replyText, replyingTo);
      setReplyText("");
      setReplyingTo(null);
      await fetchComments();
    } catch (err: any) {
      setError(err?.message ?? "Could not post reply. Please try again.");
    }
  };

  const startEdit = (comment: any) => {
    setEditingId(comment.id);
    setEditText(comment.text);
  };

  const handleSaveEdit = async (commentId: string) => {
    if (!editText.trim()) return;
    await updateComment(pId, commentId, editText);
    setEditingId(null);
    await fetchComments();
  };

  const handleDelete = async (commentId: string) => {
    const confirmed = window.confirm("Delete this comment?");
    if (!confirmed) return;
    await deleteComment(pId, commentId);
    await fetchComments();
  };

  const handleToggleLike = async (comment: any) => {
    if (!address) {
      setShowAuthModal(true);
      return;
    }
    const liked = comment.likedBy.includes(address);
    setComments((prev) =>
      prev.map((c) =>
        c.id === comment.id
          ? {
              ...c,
              likedBy: liked
                ? c.likedBy.filter((uid: string) => uid !== address)
                : [...c.likedBy, address],
            }
          : c,
      ),
    );
    try {
      await toggleCommentLike(pId, comment.id, !liked);
    } catch {
      await fetchComments();
    }
  };

  const renderMentionDropdown = (which: "new" | "reply" | "edit") =>
    mention?.which === which &&
    mentionSuggestions.length > 0 && (
      <div className="comment-mention-dropdown">
        {mentionSuggestions.map((u) => (
          <button
            type="button"
            key={u.uid}
            className="comment-mention-option"
            onClick={() => applyMention(u)}
          >
            {u.photoURL ? (
              <img src={u.photoURL} alt={u.name} className="comment-mention-option-avatar" />
            ) : (
              <span className="comment-mention-option-avatar-fallback">
                {u.name.charAt(0).toUpperCase()}
              </span>
            )}
            {u.name}
          </button>
        ))}
      </div>
    );

  const renderComment = (comment: any, isReply: boolean) => {
    const liked = !!address && comment.likedBy.includes(address);

    return (
      <div
        className={`comment-row ${isReply ? "comment-row-reply" : ""}`}
        key={comment.id}
      >
        {comment.authorPhotoURL ? (
          <img
            src={comment.authorPhotoURL}
            alt={comment.authorName}
            className="comment-row-avatar"
          />
        ) : (
          <div className="comment-row-avatar-fallback">
            {comment.authorName.charAt(0).toUpperCase()}
          </div>
        )}

        <div className="comment-row-body">
          <div className="comment-row-header">
            <span className="comment-row-name">{comment.authorName}</span>
            <span className="comment-row-time">
              {timeAgo(comment.createdAt)}
              {comment.editedAt && " (edited)"}
            </span>
          </div>

          {editingId === comment.id ? (
            <div className="comment-row-edit">
              <div className="comment-input-wrap">
                <textarea
                  ref={editTextareaRef}
                  className="comment-section-input"
                  value={editText}
                  onChange={(e) =>
                    handleComposeChange(
                      "edit",
                      e.target.value,
                      e.target.selectionStart,
                    )
                  }
                  maxLength={1000}
                />
                {renderMentionDropdown("edit")}
              </div>
              <div className="comment-row-edit-actions">
                <CustomButton
                  btnType="button"
                  title="Save"
                  styles="comment-row-edit-save"
                  handleClick={() => handleSaveEdit(comment.id)}
                />
                <CustomButton
                  btnType="button"
                  title="Cancel"
                  styles="comment-row-edit-cancel"
                  handleClick={() => setEditingId(null)}
                />
              </div>
            </div>
          ) : (
            <p className="comment-row-text">
              {renderWithMentions(comment.text)}
            </p>
          )}

          {editingId !== comment.id && (
            <div className="comment-row-actions">
              <button
                type="button"
                className={`comment-row-like ${liked ? "is-liked" : ""}`}
                onClick={() => handleToggleLike(comment)}
              >
                {liked ? "♥" : "♡"}{" "}
                {comment.likedBy.length > 0 && comment.likedBy.length}
              </button>
              <button
                type="button"
                className="comment-row-action-link"
                onClick={() => handleReplyClick(comment)}
              >
                Reply
              </button>
              {comment.authorUid === address && (
                <button
                  type="button"
                  className="comment-row-action-link"
                  onClick={() => startEdit(comment)}
                >
                  Edit
                </button>
              )}
              {(comment.authorUid === address || isAdmin) && (
                <button
                  type="button"
                  className="comment-row-action-link"
                  onClick={() => handleDelete(comment.id)}
                >
                  Delete
                </button>
              )}
            </div>
          )}

          {replyingTo === comment.id && !isReply && comment.parentId == null && (
            <form className="comment-reply-form" onSubmit={handlePostReply}>
              <div className="comment-input-wrap">
                <textarea
                  ref={replyTextareaRef}
                  className="comment-section-input"
                  placeholder="Write a reply... (type @ to tag someone)"
                  value={replyText}
                  onChange={(e) =>
                    handleComposeChange(
                      "reply",
                      e.target.value,
                      e.target.selectionStart,
                    )
                  }
                  maxLength={1000}
                />
                {renderMentionDropdown("reply")}
              </div>
              <div className="comment-row-edit-actions">
                <CustomButton
                  btnType="submit"
                  title="Reply"
                  styles="comment-row-edit-save"
                  handleClick={() => {}}
                />
                <CustomButton
                  btnType="button"
                  title="Cancel"
                  styles="comment-row-edit-cancel"
                  handleClick={() => setReplyingTo(null)}
                />
              </div>
            </form>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="comment-section">
      <h4 className="comment-section-title">Comments ({comments.length})</h4>

      <div className="comment-section-list">
        {topLevel.length > 0 ? (
          topLevel.map((comment) => (
            <div className="comment-thread" key={comment.id}>
              {renderComment(comment, false)}
              {repliesFor(comment.id).map((reply) =>
                renderComment(reply, true),
              )}
            </div>
          ))
        ) : (
          <p className="comment-section-empty">
            No comments yet. Be the first to say something!
          </p>
        )}
      </div>

      {address ? (
        <form className="comment-section-form" onSubmit={handlePost}>
          <div className="comment-input-wrap">
            <textarea
              ref={newTextareaRef}
              className="comment-section-input"
              placeholder={`Comment as ${userName ?? "you"}... (type @ to tag someone)`}
              value={text}
              onChange={(e) =>
                handleComposeChange("new", e.target.value, e.target.selectionStart)
              }
              maxLength={1000}
            />
            {renderMentionDropdown("new")}
          </div>
          {error && <p className="comment-section-error">{error}</p>}
          <CustomButton
            btnType="submit"
            title={isPosting ? "Posting..." : "Post Comment"}
            styles="comment-section-submit"
            handleClick={() => {}}
          />
        </form>
      ) : (
        <div className="comment-section-signin">
          <p>Sign in to join the conversation.</p>
          <CustomButton
            btnType="button"
            title="Sign Up / Log In"
            styles="comment-section-signin-button"
            handleClick={() => setShowAuthModal(true)}
          />
        </div>
      )}

      {showAuthModal && <AuthModal onClose={() => setShowAuthModal(false)} />}
    </div>
  );
};

export default CommentSection;
