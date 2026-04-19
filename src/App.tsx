import React, { useLayoutEffect, useRef, useState, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from '@studio-freight/lenis';
import { motion, AnimatePresence } from 'motion/react';
import { Hammer, PenTool, Home, Phone, Mail, Instagram, Facebook, Play, Pause, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import ContactForm from './components/ContactForm';

gsap.registerPlugin(ScrollTrigger);

// Helper function to split text for GSAP reveals
const splitWords = (text: string) => {
  if (typeof text !== 'string') return text;
  return text.split(' ').map((word, i) => (
    <span key={i} className="word-wrap inline-block overflow-hidden align-top pb-[0.1em]">
      <span className="word-inner inline-block translate-y-full">{word}&nbsp;</span>
    </span>
  ));
};

// --- ROBUST VIDEO COMPONENT ---
interface VideoBackgroundProps {
  id: number;
  localSrc: string;
  backupSrc: string;
  className?: string;
  isMuted?: boolean;
}

const VideoBackground = React.forwardRef<HTMLVideoElement, VideoBackgroundProps>(
  ({ id, localSrc, backupSrc, className, isMuted = true }, ref) => {
    const [useBackup, setUseBackup] = useState(false);
    const [hasError, setHasError] = useState(false);
    const [isLoaded, setIsLoaded] = useState(false);

    const currentSrc = useBackup ? backupSrc : localSrc;

    // Reliability: Re-attempt playback if it stalls
    useEffect(() => {
      const video = (ref as React.RefObject<HTMLVideoElement | null>)?.current;
      if (!video) return;

      const tryPlay = async () => {
        try {
          video.muted = isMuted;
          await video.play();
        } catch (err) {
          if (!useBackup) setUseBackup(true);
        }
      };

      tryPlay();
    }, [currentSrc, isMuted, useBackup, ref]);

    // Final static fallback images if all videos fail
    const staticFallbacks = [
      "https://images.pexels.com/photos/1249611/pexels-photo-1249611.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", // Carpentry
      "https://images.pexels.com/photos/102127/pexels-photo-102127.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", // Repairs
      "https://images.pexels.com/photos/1094767/pexels-photo-1094767.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", // Reno
      "https://images.pexels.com/photos/1454806/pexels-photo-1454806.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2", // Bathroom
    ];

    return (
      <div className={`relative w-full h-full ${className} bg-[#0a0a0a] overflow-hidden`}>
        {/* The Video Layer */}
        {!hasError && (
          <video
            key={currentSrc}
            ref={ref}
            src={currentSrc}
            autoPlay
            muted={isMuted}
            loop
            playsInline
            preload="auto"
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
            onLoadedData={() => {
              setIsLoaded(true);
              const video = (ref as React.RefObject<HTMLVideoElement | null>)?.current;
              if (video) video.play().catch(() => {});
            }}
            onError={() => {
              if (!useBackup) {
                setUseBackup(true);
              } else {
                setHasError(true);
              }
            }}
          />
        )}

        {/* Global Fallback (Static Image) - Shown if video fails or is loading */}
        {(hasError || !isLoaded) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 z-0"
          >
            <img 
              src={staticFallbacks[id % staticFallbacks.length]} 
              alt="Craftsmanship" 
              className="w-full h-full object-cover grayscale brightness-50"
              referrerPolicy="no-referrer"
            />
          </motion.div>
        )}
        
        {/* Loading Spinner for high-end feel */}
        {!isLoaded && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-8 h-8 border-2 border-white/10 border-t-white/30 rounded-full animate-spin" />
          </div>
        )}
      </div>
    );
  }
);
VideoBackground.displayName = 'VideoBackground';

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Global Video Unblocker (Industry standard for mobile/Vercel)
  useEffect(() => {
    const unblockVideos = () => {
      videoRefs.current.forEach(v => {
        if (v && v.paused) {
          v.play().catch(() => {});
        }
      });
      window.removeEventListener('click', unblockVideos);
      window.removeEventListener('touchstart', unblockVideos);
    };
    window.addEventListener('click', unblockVideos);
    window.addEventListener('touchstart', unblockVideos);
    return () => {
      window.removeEventListener('click', unblockVideos);
      window.removeEventListener('touchstart', unblockVideos);
    };
  }, []);

  // Preloader side-effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSidebarOpen(true);
    }, 2000);
    return () => {
      clearTimeout(timer);
      ScrollTrigger.getAll().forEach(t => t.kill());
    };
  }, []);

  useLayoutEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      smooth: true,
    } as any);

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);

    const ctx = gsap.context(() => {
      // Loader Timeline
      const loadTl = gsap.timeline({
        onComplete: () => {
          document.body.style.opacity = '1';
          initSite();
        }
      });

      loadTl.to('.loader-bar', { width: '100%', duration: 1.5, ease: 'power2.inOut' })
            .to('.loader-text', { y: -50, opacity: 0, duration: 0.5 })
            .to('.loader', { yPercent: -100, duration: 1, ease: 'power4.inOut' });

      function initSite() {
        // Video Initialization
        videoRefs.current.forEach((video, i) => {
          if (!video) return;
          
          ScrollTrigger.create({
            trigger: video,
            start: "top 80%",
            onEnter: () => {
              video.play().catch(e => console.log(`Video ${i} playback failed:`, e));
            },
            onEnterBack: () => {
              video.play().catch(e => console.log(`Video ${i} resume failed:`, e));
            }
          });

          // Metadata/Time tracking for the first video
          if (i === 0) {
            video.addEventListener('timeupdate', () => setCurrentTime(video.currentTime));
            video.addEventListener('loadedmetadata', () => setDuration(video.duration));
          }
        });

        // Hero Animations
        gsap.to('.hero-text span', {
          y: 0,
          stagger: 0.1,
          duration: 1.5,
          ease: 'power4.out'
        });
        gsap.to('.hero-fade', { opacity: 1, duration: 1, delay: 0.5 });

        // Hero Parallax
        gsap.to('.hero-img', {
          yPercent: 30,
          ease: 'none',
          scrollTrigger: {
            trigger: '.hero-img',
            start: 'top top',
            end: 'bottom top',
            scrub: true
          }
        });

        // Text Reveal on Scroll
        const splitElements = gsap.utils.toArray('.split-animate');
        splitElements.forEach((el: any) => {
          const words = el.querySelectorAll('.word-inner');
          gsap.to(words, {
            y: "0%",
            duration: 1,
            ease: "power3.out",
            stagger: 0.02,
            scrollTrigger: {
              trigger: el,
              start: "top 85%",
              toggleActions: "play none none reverse"
            }
          });
        });

        // Card Stack Animation
        const cards = gsap.utils.toArray('.card-item');
        cards.forEach((card: any, i) => {
          const nextCard = cards[i + 1] as HTMLElement;
          if (nextCard) {
            gsap.to(card.querySelector('.card-inner'), {
              scale: 0.9,
              opacity: 0.4,
              ease: "none",
              scrollTrigger: {
                trigger: nextCard,
                start: "top bottom",
                end: "top 10vh",
                scrub: true
              }
            });
          }
        });

        // Footer Parallax Effect
        gsap.from('.footer-sticky > div', {
          y: 100,
          opacity: 0.5,
          scale: 0.9,
          scrollTrigger: {
            trigger: '.footer-sticky',
            start: 'top bottom',
            end: 'bottom bottom',
            scrub: true
          }
        });
      }
    }, containerRef);

    return () => {
      lenis.destroy();
      ctx.revert();
    };
  }, []);

  return (
    <div ref={containerRef} className="bg-[#E3E1DC] text-[#121212] font-sans">
      {/* UTILS */}
      <div className="noise-overlay"></div>

      {/* PRELOADER */}
      <div className="loader fixed inset-0 bg-black z-[10000] flex justify-center items-center text-white">
        <div className="loader-text font-display text-[5vw] font-bold">RICKCANFIX</div>
        <div className="loader-bar absolute bottom-0 left-0 h-1 bg-white w-0"></div>
      </div>

      {/* NAVIGATION */}
      <nav className="fixed top-0 w-full p-8 flex justify-between items-center z-50 text-white mix-blend-difference">
        <div className="display font-bold text-xl tracking-tighter uppercase font-display">RickCanFix Inc</div>
        <div className="hidden md:flex gap-10 text-xs uppercase tracking-widest font-semibold">
          <a href="#services" className="hover:text-blue-500 transition-colors">Services</a>
          <a href="#about" className="hover:text-blue-500 transition-colors">About</a>
          <a href="#contact" className="hover:text-blue-500 transition-colors">Contact</a>
        </div>
        <div className="md:hidden font-display text-xs tracking-widest">MENU</div>
      </nav>

      {/* WRAPPER (Z-INDEX 10) */}
      <div className="wrapper relative z-10 bg-[#E3E1DC] mb-[100vh] shadow-[0_50px_100px_rgba(0,0,0,0.5)]">
        {/* HERO */}
        <section className="h-screen relative flex items-center justify-center overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=100" 
            className="absolute inset-0 w-full h-full object-cover brightness-50 hero-img" 
            alt="Hero Building" 
            referrerPolicy="no-referrer"
          />
          <div className="relative z-10 text-center text-white mix-blend-difference">
            <h1 className="display font-display text-[12vw] leading-none hero-text overflow-hidden font-bold">
              <span className="block translate-y-full">PRECISION</span>
            </h1>
            <h1 className="display font-display text-[12vw] leading-none hero-text overflow-hidden font-bold">
              <span className="block translate-y-full">EXCELLENCE</span>
            </h1>
            <p className="mt-8 text-sm uppercase tracking-[0.5em] opacity-0 hero-fade mix-blend-difference font-semibold">
              Master Carpentry & Home Repairs
            </p>
          </div>
        </section>

        {/* INTRO (Text Reveal) */}
        <section id="about" className="py-32 px-6 md:px-20 grid md:grid-cols-2 gap-16 max-w-[1800px] mx-auto">
          <div>
            <h2 className="display font-display text-4xl md:text-5xl leading-tight split-animate font-bold">
              {splitWords("Quality in every")}
              <br />
              <span className="text-blue-600">
                {splitWords("fix.")}
              </span>
            </h2>
          </div>
          <div className="text-xl font-light leading-relaxed text-gray-700">
            <p className="mb-8 split-animate">
              {splitWords("Welcome to RickCanFix Inc. We are your dedicated partner for master carpentry, precision repairs, and full-scale home renovations. With a commitment to reliability and craftsmanship, we transform your spaces with unmatched attention to detail.")}
            </p>
            <div className="h-px w-full bg-black/10 my-8"></div>
            <div className="flex gap-12 text-sm uppercase tracking-widest split-animate font-bold">
              <div>Serving Customers Since 2010</div>
              <div>Expert Craftsmanship</div>
            </div>
          </div>
        </section>

        {/* CARD STACK SECTION (SERVICES) */}
        <section id="services" className="stack-section relative py-[10vh] bg-[#121212] text-[#E3E1DC]">
          <div className="text-center mb-20 px-6">
            <div className="text-xs uppercase tracking-widest mb-4 opacity-50 font-bold">Expertise & Trade</div>
            <h2 className="display font-display text-5xl md:text-7xl font-bold">OUR SERVICES</h2>
          </div>

          <div className="stack-container max-w-[1400px] mx-auto relative pb-[10vh]">
            {/* Card 1 */}
            <div className="card-item sticky top-[10vh] h-[80vh] w-full flex items-center justify-center mb-[5vh]">
              <div className="card-inner w-[90%] h-full bg-[#1a1a1a] border border-white/10 overflow-hidden grid md:grid-cols-[1fr_1.2fr] shadow-2xl">
                <div className="card-content p-8 md:p-16 flex flex-col justify-between bg-[#1a1a1a] z-20">
                  <div>
                    <div className="text-5xl font-display mb-2 text-red-500/80">01</div>
                    <h3 className="text-3xl font-bold uppercase tracking-tight">Master Carpentry</h3>
                    <p className="text-sm mt-4 opacity-70 uppercase tracking-widest font-semibold">Custom Dustless System</p>
                  </div>
                  <div className="text-gray-400 font-light text-lg">
                    Featuring our signature "Bumblebee" Portable Cutting Lab. Museum-quality precision with zero-dust impact on your home.
                  </div>
                  <button className="text-left uppercase tracking-widest text-xs border-b border-white/30 pb-2 w-max hover:text-white transition-colors font-bold">
                    View Details
                  </button>
                </div>
                <div className="card-img-wrap relative w-full h-full overflow-hidden bg-[#111]">
                  <VideoBackground 
                    id={0}
                    localSrc="/carpentry.mp4"
                    backupSrc="https://player.vimeo.com/external/494252666.sd.mp4?s=bc1db91880468d2b78f44a86b3e246960d3d537d"
                    isMuted={isMuted}
                    ref={el => videoRefs.current[0] = el}
                  />
                  
                  {/* OVERLAY CONTROLS */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-black/10 hover:bg-black/30 transition-colors group">
                    {/* CENTER PLAY/PAUSE */}
                    <button 
                      onClick={() => {
                        const video = videoRefs.current[0];
                        if (video) {
                          if (isPlaying) video.pause(); else video.play();
                          setIsPlaying(!isPlaying);
                        }
                      }}
                      className="p-6 bg-white/10 backdrop-blur-md rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 active:scale-95"
                    >
                      {isPlaying ? (
                        <Pause className="w-12 h-12 text-white" fill="white" />
                      ) : (
                        <Play className="w-12 h-12 text-white" fill="white" />
                      )}
                    </button>
                    
                    {/* PROGRESS BAR & FULLSCREEN */}
                    <div className="absolute bottom-6 left-6 right-6 flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity z-50">
                       <input 
                        type="range" 
                        min="0" 
                        max={duration} 
                        step="0.1" 
                        value={currentTime}
                        onChange={(e) => {
                          const video = videoRefs.current[0];
                          if (video) {
                            video.currentTime = parseFloat(e.target.value);
                            setCurrentTime(video.currentTime);
                          }
                        }}
                        className="flex-1 accent-red-500 h-1 bg-white/20 rounded-lg appearance-none cursor-pointer"
                       />
                       
                       <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          const video = videoRefs.current[0];
                          if (video) {
                            if (video.requestFullscreen) video.requestFullscreen();
                          }
                        }}
                        className="p-2 bg-black/40 hover:bg-black/80 rounded-lg border border-white/10 transition-colors"
                        title="Fullscreen"
                       >
                         <Maximize2 className="w-4 h-4 text-white" />
                       </button>

                       {/* PORTABLE SOUND BUTTON (Moved here to avoid clash) */}
                       <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsMuted(!isMuted);
                        }}
                        className="p-2 bg-black/40 hover:bg-black/80 rounded-lg border border-white/10 transition-colors"
                        title={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted ? (
                          <VolumeX className="w-4 h-4 text-white" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-red-500" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="card-item sticky top-[10vh] h-[80vh] w-full flex items-center justify-center mb-[5vh]">
              <div className="card-inner w-[90%] h-full bg-[#1a1a1a] border border-white/10 overflow-hidden grid md:grid-cols-[1fr_1.2fr] shadow-2xl">
                <div className="card-content p-8 md:p-16 flex flex-col justify-between bg-[#1a1a1a] z-20">
                  <div>
                    <div className="text-5xl font-display mb-2 text-green-500/80">02</div>
                    <h3 className="text-3xl font-bold uppercase tracking-tight">Home Repairs</h3>
                    <p className="text-sm mt-4 opacity-70 uppercase tracking-widest font-semibold">Condo Specialist</p>
                  </div>
                  <div className="text-gray-400 font-light text-lg">
                    Ontario's trusted choice for dustless condo renovations. We respect your space and your neighbors while delivering excellence.
                  </div>
                  <button className="text-left uppercase tracking-widest text-xs border-b border-white/30 pb-2 w-max hover:text-white transition-colors font-bold">
                    View Details
                  </button>
                </div>
                <div className="card-img-wrap relative w-full h-full overflow-hidden bg-[#111]">
                  <VideoBackground 
                    id={1}
                    localSrc="/repairs.mp4"
                    backupSrc="https://player.vimeo.com/external/415858661.sd.mp4?s=d005e8e811fd3593630f9a2d677d2e07897c8d9e"
                    ref={el => videoRefs.current[1] = el}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <Play className="w-12 h-12 text-white" />
                  </div>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="card-item sticky top-[10vh] h-[80vh] w-full flex items-center justify-center mb-[5vh]">
              <div className="card-inner w-[90%] h-full bg-[#1a1a1a] border border-white/10 overflow-hidden grid md:grid-cols-[1fr_1.2fr] shadow-2xl">
                <div className="card-content p-8 md:p-16 flex flex-col justify-between bg-[#1a1a1a] z-20">
                  <div>
                    <div className="text-5xl font-display mb-2 text-blue-500/80">03</div>
                    <h3 className="text-3xl font-bold uppercase tracking-tight">Renovations</h3>
                    <p className="text-sm mt-4 opacity-70 uppercase tracking-widest font-semibold">Modern Upgrades</p>
                  </div>
                  <div className="text-gray-400 font-light text-lg">
                    Complete kitchen, bath, and basement transformations. We manage the entire process from planning to final polish.
                  </div>
                  <button className="text-left uppercase tracking-widest text-xs border-b border-white/30 pb-2 w-max hover:text-white transition-colors font-bold">
                    View Details
                  </button>
                </div>
                <div className="card-img-wrap relative w-full h-full overflow-hidden bg-[#111]">
                  <VideoBackground 
                    id={2}
                    localSrc="/banz_reno_vid2.mp4"
                    backupSrc="https://player.vimeo.com/external/405432666.sd.mp4?s=33c3748290f6c770de4d5750d0360a7d5a576395"
                    ref={el => videoRefs.current[2] = el}
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <Play className="w-12 h-12 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT FORM SECTION */}
        <section id="contact" className="py-40 bg-[#121212] text-white">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center mb-16">
              <h2 className="display font-display text-4xl md:text-6xl mb-6 font-bold uppercase tracking-tighter">Start Your Project</h2>
              <p className="text-gray-400 text-lg md:text-xl font-light">
                Ready to transform your home? Fill out the form below with your project details and any reference images. Rick will get back to you personally.
              </p>
            </div>
            <ContactForm />
          </div>
        </section>

        {/* FINAL SECTION */}
        <section className="py-40 bg-[#E3E1DC] text-center flex flex-col items-center justify-center relative z-10">
          <h2 className="display font-display text-3xl md:text-5xl mb-8 font-bold uppercase">
            Your Trusted Craftsman
          </h2>
          <div className="max-w-xl text-gray-600 font-light mb-12 leading-relaxed text-lg">
            Our mission is to bring your visions to life with perfection. With a focus on punctuality and precision, we ensure every project exceeds expectations.
          </div>
          
          {/* VIDEO SECTION */}
          <div className="w-full max-w-4xl px-6 mb-12">
            <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border-4 border-white bg-[#111]">
              <VideoBackground 
                id={3}
                localSrc="/banz_reno_washroom.mp4"
                backupSrc="https://player.vimeo.com/external/405432666.sd.mp4?s=33c3748290f6c770de4d5750d0360a7d5a576395"
                ref={el => videoRefs.current[3] = el}
              />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                <Play className="w-12 h-12 text-white" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
              <div className="absolute bottom-6 left-8 text-left">
                <p className="text-white font-display text-xl font-bold uppercase tracking-tight">Luxury Transformation</p>
                <p className="text-white/80 text-sm font-semibold uppercase tracking-widest">Master Craftsman Finishes</p>
              </div>
            </div>
          </div>

          <div className="w-32 h-px bg-black/20 my-12"></div>
          
          <div className="max-w-3xl px-6 text-center space-y-8 mb-4">
            <h3 className="display font-display text-2xl md:text-4xl leading-tight font-bold uppercase tracking-tight">
              No work is too small or too big for RCF; we are available 24/7, and our word is concrete.
            </h3>
            <p className="text-lg md:text-xl text-gray-700 font-medium tracking-wide uppercase opacity-80">
              Call us today to book an inspection or to get the work done with our Expert Team ASAP!
            </p>
          </div>
        </section>
      </div>

      {/* FOOTER (FIXED BEHIND) */}
      <footer className="footer-sticky fixed bottom-0 left-0 w-full h-screen z-1 bg-[#111] text-white flex flex-col justify-center items-center">
        <div className="relative z-10 text-center w-full px-6">
          <div className="text-xs uppercase tracking-[0.3em] mb-4 text-gray-500 font-bold">Ready for a change?</div>
          <a href="mailto:bigaiagent@gmail.com" className="display font-display text-[8vw] leading-none hover:text-gray-400 transition-colors font-bold uppercase block">
            GET A QUOTE
          </a>
          <div className="flex flex-col md:flex-row justify-center items-center gap-8 mt-12 text-sm md:text-base uppercase tracking-widest text-gray-400 font-bold">
            <div className="flex items-center gap-2 hover:text-white transition-colors">
              <Phone className="w-4 h-4" /> +1 647-609-1932
            </div>
            <a href="mailto:bigaiagent@gmail.com" className="flex items-center gap-2 hover:text-white transition-colors">
              <Mail className="w-4 h-4" /> bigaiagent@gmail.com
            </a>
          </div>
          <div className="flex justify-center gap-6 mt-12">
            <Instagram className="w-6 h-6 text-gray-500 hover:text-white transition-colors cursor-pointer" />
            <Facebook className="w-6 h-6 text-gray-500 hover:text-white transition-colors cursor-pointer" />
          </div>
          <div className="mt-20 text-[10px] text-gray-700 font-bold tracking-widest">
            © 2026 RICKCANFIX INC. CRAFTSMANSHIP & PRECISION.
          </div>
        </div>
        {/* Footer Background Image */}
        <img 
          src="https://picsum.photos/seed/sawdust/1920/1080?blur=4" 
          className="absolute inset-0 w-full h-full object-cover opacity-10 pointer-events-none" 
          alt="Footer background"
          referrerPolicy="no-referrer"
        />
      </footer>

      {/* SIDEBAR */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-1/2 -translate-y-1/2 bg-[#E3E1DC] p-6 border-l border-gray-300 shadow-2xl z-[9999] flex flex-col gap-4 w-64 rounded-l-3xl"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">Direct Contact</span>
              <button 
                onClick={() => setIsSidebarOpen(false)}
                className="text-gray-400 hover:text-black p-1"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="p-4 bg-white/50 rounded-2xl flex items-center gap-4 group cursor-pointer hover:bg-white transition-all shadow-sm">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white shrink-0">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Call Now</p>
                  <p className="text-sm font-bold text-gray-900">+1 647-609-1932</p>
                </div>
              </div>
              <div className="p-4 bg-white/50 rounded-2xl flex items-center gap-4 group cursor-pointer hover:bg-white transition-all shadow-sm">
                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white shrink-0">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-bold text-gray-400">Email Rick</p>
                  <p className="text-[11px] font-bold text-gray-900 truncate">bigaiagent@gmail.com</p>
                </div>
              </div>
            </div>
            <div className="mt-2 p-4 bg-blue-600 rounded-2xl text-white">
              <p className="text-xs font-bold leading-tight">Serving Toronto, ON and surrounding areas with excellence.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
