import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Calendar, Tag, User } from 'lucide-react'
import PageFrame from '../components/PageFrame'
import { supabase } from '../lib/supabase'

interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  body: string | null
  featured_image: string | null
  author_name: string | null
  published_at: string | null
  status: string
  tags: string[] | null
}

function BlogPostDetailInner() {
  const { slug } = useParams<{ slug: string }>()
  const navigate = useNavigate()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const load = async () => {
      if (!slug) {
        setError('Missing post.')
        setLoading(false)
        return
      }
      setLoading(true)
      const { data, error: fetchError } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .maybeSingle()

      if (fetchError) {
        setError(fetchError.message)
        setPost(null)
      } else if (!data) {
        setError('Post not found.')
        setPost(null)
      } else {
        setPost(data as BlogPost)
        setError('')
      }
      setLoading(false)
    }
    void load()
  }, [slug])

  const formatDate = (d: string | null) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  if (loading) {
    return (
      <div className="pt-24 pb-16 px-4 sm:px-8 lg:px-12 max-w-3xl mx-auto">
        <div className="h-10 w-40 bg-gray-100 animate-pulse rounded-lg mb-6" />
        <div className="h-64 bg-gray-100 animate-pulse rounded-2xl" />
      </div>
    )
  }

  if (error || !post) {
    return (
      <div className="pt-24 pb-16 px-4 sm:px-8 lg:px-12 max-w-lg mx-auto text-center">
        <p className="text-sm text-[#696a67] mb-4">{error || 'Post not found.'}</p>
        <button
          type="button"
          onClick={() => navigate('/blog')}
          className="inline-flex items-center gap-1.5 rounded-full bg-[#2b2b2b] text-white px-4 py-2 text-xs font-semibold"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Journal
        </button>
      </div>
    )
  }

  return (
    <article className="pt-24 pb-16 px-4 sm:px-8 lg:px-12 max-w-3xl mx-auto">
      <Link
        to="/blog"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#696a67] hover:text-[#2b2b2b] mb-6"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        Journal
      </Link>

      {post.featured_image ? (
        <div className="rounded-3xl overflow-hidden mb-8 aspect-[16/9] bg-[#f5f5f0]">
          <img src={post.featured_image} alt={post.title} className="w-full h-full object-cover" />
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 text-xs text-[#696a67] mb-4">
        {post.author_name ? (
          <span className="inline-flex items-center gap-1">
            <User className="w-3 h-3" />
            {post.author_name}
          </span>
        ) : null}
        {post.published_at ? (
          <span className="inline-flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(post.published_at)}
          </span>
        ) : null}
        {post.tags && post.tags.length > 0 ? (
          <span className="inline-flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {post.tags.join(', ')}
          </span>
        ) : null}
      </div>

      <h1
        className="text-[#2b2b2b] leading-tight mb-4"
        style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: 'clamp(1.75rem, 4vw, 2.5rem)' }}
      >
        {post.title}
      </h1>

      {post.excerpt ? <p className="text-[#696a67] text-base leading-relaxed mb-8">{post.excerpt}</p> : null}

      <div className="prose prose-sm max-w-none text-[#2b2b2b] whitespace-pre-wrap leading-relaxed">
        {post.body || 'More details coming soon.'}
      </div>
    </article>
  )
}

export default function BlogPostDetail() {
  return (
    <PageFrame frameColor="#FFD94A">
      <BlogPostDetailInner />
    </PageFrame>
  )
}
