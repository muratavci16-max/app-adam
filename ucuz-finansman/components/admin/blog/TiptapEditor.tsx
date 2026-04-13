'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import {
  Bold, Italic, Strikethrough, Code, List, ListOrdered,
  Quote, Heading1, Heading2, Heading3, Undo, Redo,
  Link as LinkIcon, Image as ImageIcon, Minus
} from 'lucide-react'

interface TiptapEditorProps {
  content: string
  onChange: (html: string) => void
}

export default function TiptapEditor({ content, onChange }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false, HTMLAttributes: { class: 'text-primary-600 underline' } }),
      Image.configure({ HTMLAttributes: { class: 'max-w-full rounded-lg' } }),
      Placeholder.configure({ placeholder: 'Yazınızı buraya yazın...' }),
    ],
    content,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none min-h-[400px] text-neutral-800',
      },
    },
  })

  if (!editor) return null

  const btn = (active: boolean) =>
    `p-1.5 rounded-lg text-sm transition-all ${active ? 'bg-primary-100 text-primary-700' : 'text-neutral-500 hover:bg-neutral-100 hover:text-neutral-700'}`

  const addLink = () => {
    const url = prompt('URL:')
    if (url) editor.chain().focus().setLink({ href: url }).run()
  }

  const addImage = () => {
    const url = prompt('Görsel URL:')
    if (url) editor.chain().focus().setImage({ src: url }).run()
  }

  return (
    <div className="border border-neutral-200 rounded-xl overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 flex-wrap p-2 border-b border-neutral-100 bg-neutral-50">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={btn(editor.isActive('bold'))} title="Kalın"><Bold className="w-4 h-4" /></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={btn(editor.isActive('italic'))} title="İtalik"><Italic className="w-4 h-4" /></button>
        <button onClick={() => editor.chain().focus().toggleStrike().run()} className={btn(editor.isActive('strike'))} title="Üstü çizili"><Strikethrough className="w-4 h-4" /></button>
        <button onClick={() => editor.chain().focus().toggleCode().run()} className={btn(editor.isActive('code'))} title="Kod"><Code className="w-4 h-4" /></button>

        <span className="w-px h-5 bg-neutral-200 mx-1" />

        <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={btn(editor.isActive('heading', { level: 1 }))} title="Başlık 1"><Heading1 className="w-4 h-4" /></button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={btn(editor.isActive('heading', { level: 2 }))} title="Başlık 2"><Heading2 className="w-4 h-4" /></button>
        <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={btn(editor.isActive('heading', { level: 3 }))} title="Başlık 3"><Heading3 className="w-4 h-4" /></button>

        <span className="w-px h-5 bg-neutral-200 mx-1" />

        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={btn(editor.isActive('bulletList'))} title="Liste"><List className="w-4 h-4" /></button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={btn(editor.isActive('orderedList'))} title="Numaralı Liste"><ListOrdered className="w-4 h-4" /></button>
        <button onClick={() => editor.chain().focus().toggleBlockquote().run()} className={btn(editor.isActive('blockquote'))} title="Alıntı"><Quote className="w-4 h-4" /></button>

        <span className="w-px h-5 bg-neutral-200 mx-1" />

        <button onClick={addLink} className={btn(editor.isActive('link'))} title="Link"><LinkIcon className="w-4 h-4" /></button>
        <button onClick={addImage} className={btn(false)} title="Görsel"><ImageIcon className="w-4 h-4" /></button>
        <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className={btn(false)} title="Çizgi"><Minus className="w-4 h-4" /></button>

        <span className="w-px h-5 bg-neutral-200 mx-1 ml-auto" />

        <button onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} className={btn(false) + ' disabled:opacity-30'} title="Geri Al"><Undo className="w-4 h-4" /></button>
        <button onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} className={btn(false) + ' disabled:opacity-30'} title="Yeniden Yap"><Redo className="w-4 h-4" /></button>
      </div>

      {/* Editor */}
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
