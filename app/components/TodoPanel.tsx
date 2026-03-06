'use client';

import { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Check, Pencil, X, GripVertical } from 'lucide-react';

interface Todo {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

const STORAGE_KEY = 'meridian-todos';

function loadTodos(): Todo[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveTodos(todos: Todo[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

export function TodoPanel() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [input, setInput] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const editRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTodos(loadTodos());
  }, []);

  useEffect(() => {
    if (editingId && editRef.current) {
      editRef.current.focus();
    }
  }, [editingId]);

  const update = (next: Todo[]) => {
    setTodos(next);
    saveTodos(next);
  };

  const addTodo = () => {
    const text = input.trim();
    if (!text) return;
    const next = [
      { id: Date.now().toString(), text, done: false, createdAt: Date.now() },
      ...todos,
    ];
    update(next);
    setInput('');
    inputRef.current?.focus();
  };

  const toggleDone = (id: string) => {
    update(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  };

  const deleteTodo = (id: string) => {
    update(todos.filter(t => t.id !== id));
  };

  const startEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditText(todo.text);
  };

  const commitEdit = () => {
    const text = editText.trim();
    if (text && editingId) {
      update(todos.map(t => t.id === editingId ? { ...t, text } : t));
    }
    setEditingId(null);
  };

  const clearDone = () => {
    update(todos.filter(t => !t.done));
  };

  const pending = todos.filter(t => !t.done);
  const done = todos.filter(t => t.done);

  return (
    <div className="space-y-5 stagger-children">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card rounded-xl p-4">
          <div className="stat-value text-2xl">{todos.length}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">全部待办</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="stat-value text-2xl text-violet-400">{pending.length}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">进行中</div>
        </div>
        <div className="glass-card rounded-xl p-4">
          <div className="stat-value text-2xl text-emerald-400">{done.length}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5">已完成</div>
        </div>
      </div>

      {/* Input */}
      <div className="glass-card rounded-2xl p-5">
        <div className="text-sm font-medium mb-3 text-muted-foreground">添加待办</div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && addTodo()}
            placeholder="输入待办事项，回车添加..."
            className="flex-1 bg-secondary/30 border border-border/50 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500/50 focus:bg-secondary/50 transition-all placeholder:text-muted-foreground/50"
          />
          <button
            onClick={addTodo}
            className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium transition-colors flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            添加
          </button>
        </div>
      </div>

      {/* Pending todos */}
      {pending.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <div className="text-sm font-medium mb-3">进行中 · {pending.length}</div>
          <div className="space-y-1.5">
            {pending.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                editingId={editingId}
                editText={editText}
                editRef={editRef}
                onToggle={toggleDone}
                onDelete={deleteTodo}
                onStartEdit={startEdit}
                onEditChange={setEditText}
                onCommitEdit={commitEdit}
                onCancelEdit={() => setEditingId(null)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Done todos */}
      {done.length > 0 && (
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-medium text-muted-foreground">已完成 · {done.length}</div>
            <button
              onClick={clearDone}
              className="text-[11px] text-muted-foreground hover:text-red-400 transition-colors"
            >
              清空已完成
            </button>
          </div>
          <div className="space-y-1.5">
            {done.map(todo => (
              <TodoItem
                key={todo.id}
                todo={todo}
                editingId={editingId}
                editText={editText}
                editRef={editRef}
                onToggle={toggleDone}
                onDelete={deleteTodo}
                onStartEdit={startEdit}
                onEditChange={setEditText}
                onCommitEdit={commitEdit}
                onCancelEdit={() => setEditingId(null)}
              />
            ))}
          </div>
        </div>
      )}

      {todos.length === 0 && (
        <div className="glass-card rounded-2xl p-10 text-center">
          <div className="text-3xl mb-3">✓</div>
          <div className="text-sm text-muted-foreground">暂无待办，添加一条开始吧</div>
        </div>
      )}
    </div>
  );
}

interface TodoItemProps {
  todo: Todo;
  editingId: string | null;
  editText: string;
  editRef: React.RefObject<HTMLInputElement | null>;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onStartEdit: (todo: Todo) => void;
  onEditChange: (text: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
}

function TodoItem({
  todo, editingId, editText, editRef,
  onToggle, onDelete, onStartEdit, onEditChange, onCommitEdit, onCancelEdit,
}: TodoItemProps) {
  const isEditing = editingId === todo.id;

  return (
    <div className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors hover:bg-secondary/30 ${todo.done ? 'opacity-50' : ''}`}>
      <button
        onClick={() => onToggle(todo.id)}
        className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
          todo.done
            ? 'bg-emerald-500 border-emerald-500 text-white'
            : 'border-border/60 hover:border-violet-400'
        }`}
      >
        {todo.done && <Check className="h-3 w-3" />}
      </button>

      {isEditing ? (
        <input
          ref={editRef}
          type="text"
          value={editText}
          onChange={e => onEditChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') onCommitEdit();
            if (e.key === 'Escape') onCancelEdit();
          }}
          onBlur={onCommitEdit}
          className="flex-1 bg-secondary/50 border border-violet-500/50 rounded-lg px-2 py-1 text-sm outline-none"
        />
      ) : (
        <span
          className={`flex-1 text-sm cursor-pointer select-none ${todo.done ? 'line-through text-muted-foreground' : ''}`}
          onDoubleClick={() => onStartEdit(todo)}
        >
          {todo.text}
        </span>
      )}

      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {!isEditing && (
          <button
            onClick={() => onStartEdit(todo)}
            className="p-1 rounded-md text-muted-foreground hover:text-violet-400 hover:bg-secondary/50 transition-colors"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
        )}
        <button
          onClick={() => onDelete(todo.id)}
          className="p-1 rounded-md text-muted-foreground hover:text-red-400 hover:bg-secondary/50 transition-colors"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
