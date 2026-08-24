import { Link } from 'react-router-dom';
import { Sparkles, Shield, DollarSign, Users, Heart, MessageCircle, TrendingUp, ArrowRight, Star, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { modelService } from '@/services';
import { ModelCard } from '@/components/shared/ModelCard';
import { useEffect, useState } from 'react';
import type { User } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { roleHomeRoute } from '@/lib/rbac';

export function LandingPage() {
  const { user } = useAuth();
  const [trending, setTrending] = useState<User[]>([]);
  const [heroSlide, setHeroSlide] = useState(0);
  const [heroPaused, setHeroPaused] = useState(false);
  const heroImages = ['/hero/hero-1.jpg', '/hero/hero-2.jpg', '/hero/hero-3.jpg', '/hero/hero-4.jpg'];

  useEffect(() => {
    modelService.getTrending().then(setTrending);
  }, []);

  useEffect(() => {
    if (heroPaused) return;
    const timer = window.setInterval(() => {
      setHeroSlide((current) => (current + 1) % heroImages.length);
    }, 4000);
    return () => window.clearInterval(timer);
  }, [heroPaused, heroImages.length]);

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-ink-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/image-removebg-preview.png" alt="CreatorHub" className="w-9 h-9 rounded-xl" />
            <span className="font-display font-bold text-xl text-ink-900">CreatorHub</span>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/explore"><Button variant="ghost" size="sm">Explore</Button></Link>
            {user ? (
              <Link to={roleHomeRoute[user.role]}><Button variant="outline" size="sm">Home</Button></Link>
            ) : (
              <>
                <Link to="/login"><Button variant="outline" size="sm">Sign in</Button></Link>
                <Link to="/register"><Button size="sm">Get started</Button></Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative min-h-[620px] overflow-hidden bg-ink-900"
        onMouseEnter={() => setHeroPaused(true)}
        onMouseLeave={() => setHeroPaused(false)}
      >
        {heroImages.map((image, index) => (
          <div
            key={image}
            className={`absolute inset-0 bg-cover bg-center transition-opacity duration-1000 ${index === heroSlide ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundImage: `url(${image})` }}
            aria-hidden={index !== heroSlide}
          />
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-black/20" />
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-20 lg:py-28 min-h-[620px] flex items-center">
          <div className="max-w-2xl">
            <h1 className="font-display font-bold text-4xl lg:text-6xl text-white leading-[1.1] tracking-tight">
              Connect with your favorite creators like never before
            </h1>
            <p className="text-lg text-white/85 mt-6 leading-relaxed max-w-xl">
              Subscribe to exclusive content, message directly, unlock premium posts, and support the creators you love — all in one elegant platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <Link to="/register">
                <Button size="lg" className="w-full sm:w-auto">Start exploring <ArrowRight className="w-4 h-4" /></Button>
              </Link>
              <Link to="/explore">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">Browse creators</Button>
              </Link>
            </div>
            <div className="flex items-center gap-6 mt-10 text-white">
              <div>
                <p className="text-2xl font-display font-bold text-ink-900">12K+</p>
                <p className="text-sm text-white/65">Creators</p>
              </div>
              <div className="w-px h-10 bg-white/30" />
              <div>
                <p className="text-2xl font-display font-bold text-ink-900">500K+</p>
                <p className="text-sm text-white/65">Members</p>
              </div>
              <div className="w-px h-10 bg-white/30" />
              <div>
                <p className="text-2xl font-display font-bold text-ink-900">$2M+</p>
                <p className="text-sm text-white/65">Paid out</p>
              </div>
            </div>
          </div>
        </div>
        <div className="absolute bottom-7 left-1/2 z-20 -translate-x-1/2 flex items-center gap-3">
          <button type="button" onClick={() => setHeroSlide((heroSlide - 1 + heroImages.length) % heroImages.length)} className="p-2 rounded-full bg-black/35 text-white hover:bg-black/60" title="Previous slide" aria-label="Previous slide">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            {heroImages.map((image, index) => (
              <button key={image} type="button" onClick={() => setHeroSlide(index)} className={`h-2 rounded-full transition-all ${index === heroSlide ? 'w-8 bg-white' : 'w-2 bg-white/50 hover:bg-white/80'}`} title={`Slide ${index + 1}`} aria-label={`Go to slide ${index + 1}`} />
            ))}
          </div>
          <button type="button" onClick={() => setHeroSlide((heroSlide + 1) % heroImages.length)} className="p-2 rounded-full bg-black/35 text-white hover:bg-black/60" title="Next slide" aria-label="Next slide">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl text-ink-900">Everything you need to support creators</h2>
          <p className="text-ink-500 mt-3">A complete platform built for both fans and creators</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { icon: Heart, title: 'Exclusive Content', desc: 'Access premium posts, photos, and videos from your favorite creators.' },
            { icon: MessageCircle, title: 'Direct Messaging', desc: 'Chat one-on-one with creators and get personal responses.' },
            { icon: Lock, title: 'PPV Content', desc: 'Unlock individual pieces of premium content on demand.' },
            { icon: DollarSign, title: 'Tips & Support', desc: 'Show appreciation with tips and support creators directly.' },
            { icon: TrendingUp, title: 'Creator Analytics', desc: 'Creators get powerful insights into their audience and earnings.' },
            { icon: Shield, title: 'Secure & Private', desc: 'Your data and payments are always protected and encrypted.' },
          ].map((f) => (
            <div key={f.title} className="p-6 rounded-2xl border border-ink-200/60 bg-white hover:shadow-card transition-all duration-200">
              <div className="w-12 h-12 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-ink-900 mb-2">{f.title}</h3>
              <p className="text-sm text-ink-600 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trending Creators */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="font-display font-bold text-2xl text-ink-900">Trending Creators</h2>
            <p className="text-sm text-ink-500">Discover popular creators on the platform</p>
          </div>
          <Link to="/explore"><Button variant="ghost" size="sm">View all <ArrowRight className="w-4 h-4" /></Button></Link>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {trending.slice(0, 4).map((m) => (
            <ModelCard key={m.id} model={m} />
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <div className="relative rounded-3xl bg-ink-900 overflow-hidden p-12 lg:p-16 text-center">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent-500/20 rounded-full blur-3xl" />
          <div className="relative">
            <h2 className="font-display font-bold text-3xl lg:text-4xl text-white">Ready to join the community?</h2>
            <p className="text-ink-300 mt-4 max-w-lg mx-auto">Whether you're a creator looking to monetize or a fan wanting exclusive access — CreatorHub is for you.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
              <Link to="/register"><Button size="lg">Create account</Button></Link>
              <Link to="/login"><Button variant="outline" size="lg" className="bg-white/10 border-white/20 text-white hover:bg-white/20 hover:border-white/30">Sign in</Button></Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-ink-100">
        <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/image-removebg-preview.png" alt="CreatorHub" className="w-7 h-7 rounded-lg" />
            <span className="font-display font-bold text-ink-900">CreatorHub</span>
          </div>
          <p className="text-sm text-ink-500">© 2026 CreatorHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
