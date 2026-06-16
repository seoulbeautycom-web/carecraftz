import { useState, useEffect } from 'react'
import { Calendar, User, ArrowRight, Tag } from 'lucide-react'
import { supabase } from '../lib/supabase'
import PageFrame from '../components/PageFrame'

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

function BlogInner() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [featured, setFeatured] = useState<BlogPost | null>(null)

  useEffect(() => {
    async function fetchPosts() {
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false })
      if (data && data.length > 0) {
        setFeatured(data[0])
        setPosts(data.slice(1))
      }
      setLoading(false)
    }
    fetchPosts()
  }, [])

  const formatDate = (d: string | null) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  }

  return (
    <div className="pt-24 pb-16 px-4 sm:px-8 lg:px-12 max-w-7xl mx-auto">

      {/* Page heading */}
      <div className="mb-10 text-center">
        <h1 className="text-5xl md:text-6xl font-light text-[#2b2b2b] mb-3">The Journal</h1>
        <p className="text-[#696a67] text-base max-w-md mx-auto">Stories, rituals and honest ingredients talk — straight from the lab.</p>
      </div>


      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl bg-gray-100 animate-pulse h-72" />
          ))}
        </div>
      ) : (
        <>
          {/* Featured post */}
          {featured && (
            <div
              className="rounded-3xl overflow-hidden mb-10 cursor-pointer group relative"
              style={{ minHeight: 440 }}
              onClick={() => { /* blog detail page coming soon */ }}
            >
              {featured.featured_image ? (
                <img
                  src={featured.featured_image}
                  alt={featured.title}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="absolute inset-0 bg-[#c8f135]" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <span className="inline-block px-3 py-1 bg-[#ff9570] text-white text-xs font-semibold rounded-full mb-3 uppercase tracking-wider">
                  Featured
                </span>
                <h2 className="text-3xl md:text-4xl font-semibold text-white mb-3 max-w-2xl leading-tight">{featured.title}</h2>
                {featured.excerpt && (
                  <p className="text-white/80 text-sm mb-4 max-w-xl leading-relaxed">{featured.excerpt}</p>
                )}
                <div className="flex items-center gap-4 text-white/60 text-xs">
                  {featured.author_name && (
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{featured.author_name}</span>
                  )}
                  {featured.published_at && (
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{formatDate(featured.published_at)}</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Post grid */}
          {posts.length === 0 ? (
            <div className="text-center py-16 text-[#696a67]">More posts coming soon.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {posts.map((post, i) => {
                const cardColors = ['#fce4ec', '#e8f5e9', '#fff9c4', '#ede7f6', '#e3f2fd', '#fff3e0']
                const cardColor = cardColors[i % cardColors.length]
                return (
                  <article
                    key={post.id}
                    className="rounded-2xl overflow-hidden cursor-pointer group flex flex-col"
                    style={{ backgroundColor: cardColor }}
                    onClick={() => { /* blog detail page coming soon */ }}
                  >
                    <div className="h-48 overflow-hidden relative">
                      {post.featured_image ? (
                        <img
                          src={post.featured_image}
                          alt={post.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: cardColor }}>
                          <span className="text-5xl opacity-30">✦</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      {post.tags && post.tags.length > 0 && (
                        <span className="text-xs font-semibold uppercase tracking-wider text-[#696a67] mb-2 flex items-center gap-1">
                          <Tag className="w-3 h-3" />{post.tags[0]}
                        </span>
                      )}
                      <h3 className="font-semibold text-[#2b2b2b] text-base leading-snug mb-2 flex-1">{post.title}</h3>
                      {post.excerpt && (
                        <p className="text-xs text-[#696a67] leading-relaxed mb-3 line-clamp-2">{post.excerpt}</p>
                      )}
                      <div className="flex items-center justify-between mt-auto pt-2">
                        <div className="flex items-center gap-3 text-[#696a67] text-xs">
                          {post.author_name && <span>{post.author_name}</span>}
                          {post.published_at && <span>{formatDate(post.published_at)}</span>}
                        </div>
                        <ArrowRight className="w-4 h-4 text-[#2b2b2b] group-hover:translate-x-1 transition-transform" />
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default function Blog() {
  return (
    <PageFrame frameColor="#FFD94A" showFooter={true}>
      <BlogInner />
    </PageFrame>
  )
}
