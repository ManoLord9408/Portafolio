import { useState, useEffect, useRef } from "react";
import { Mail, Github, Linkedin, Phone, FileText, MapPin, ExternalLink, Download, Palette } from "lucide-react";

const THEMES = {
  ocean: { name: "Ocean", logoGrad: "from-indigo-500 to-cyan-400", primaryBtn: "bg-indigo-500/90 hover:bg-indigo-500", link: "text-indigo-300 hover:text-indigo-200", chipBorder: "border-slate-700", chipBg: "bg-slate-800/60", navBorder: "border-slate-800", bgStart: "#0f172a", bgEnd: "#020617", grid: "#334155", particle: "rgba(129,140,248,0.9)", lineRGB: "94,234,212" },
  forest: { name: "Forest", logoGrad: "from-emerald-500 to-lime-400", primaryBtn: "bg-emerald-500/90 hover:bg-emerald-500", link: "text-emerald-300 hover:text-emerald-200", chipBorder: "border-emerald-900/50", chipBg: "bg-emerald-900/30", navBorder: "border-emerald-900/40", bgStart: "#052e2b", bgEnd: "#031a18", grid: "#064e3b", particle: "rgba(52,211,153,0.9)", lineRGB: "163,230,53" },
  sunset: { name: "Sunset", logoGrad: "from-rose-500 to-amber-400", primaryBtn: "bg-rose-500/90 hover:bg-rose-500", link: "text-rose-300 hover:text-rose-200", chipBorder: "border-rose-900/50", chipBg: "bg-rose-900/30", navBorder: "border-rose-900/40", bgStart: "#2a0f15", bgEnd: "#170206", grid: "#7f1d1d", particle: "rgba(251,113,133,0.9)", lineRGB: "251,191,36" },
  mono:   { name: "Mono", logoGrad: "from-slate-400 to-slate-200", primaryBtn: "bg-slate-400/90 hover:bg-slate-400 text-slate-900", link: "text-slate-200 hover:text-white", chipBorder: "border-slate-600", chipBg: "bg-slate-800/60", navBorder: "border-slate-700", bgStart: "#0b0b0c", bgEnd: "#000000", grid: "#374151", particle: "rgba(226,232,240,0.9)", lineRGB: "148,163,184" },
};
const THEME_KEYS = Object.keys(THEMES);
const safeTheme = (key) => THEMES[key] || THEMES.ocean;
function BackgroundFX({ active = true, theme }) {
  const t = theme || THEMES.ocean;
  const canvasRef = useRef(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    if (!active) {
      cancelAnimationFrame(rafRef.current);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    let width = 0, height = 0, pixelRatio = 1;
    const setSize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth, h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      width = w; height = h; pixelRatio = dpr;
    };
    setSize();

    const mouse = { x: width / 2, y: height / 2, r: 120 };
    const BASE_AREA = 800;
    const PARTICLES = Math.min(150, Math.floor((width * height) / (BASE_AREA * pixelRatio)));
    const CONFIG = { MAX_SPEED: 2.5, DRAG: 0.99, BASE_VEL: 3, MOUSE_FORCE: 1.2, LINK_DIST: 110 };

    const particles = Array.from({ length: PARTICLES }, () => {
      const angle = Math.random() * Math.PI * 2;
      // Ensure all particles start with significant velocity
      const minSpeed = CONFIG.BASE_VEL * 0.8;  // Minimum 80% of BASE_VEL
      const speed = minSpeed + (Math.random() * CONFIG.BASE_VEL); 
      
      // Add random position spread
      const margin = 50; // Keep particles away from edges
      return {
        x: margin + Math.random() * (width - margin * 2),
        y: margin + Math.random() * (height - margin * 2),
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        s: Math.random() * 1.6 + 0.4,
      };
    });


    const onResize = () => setSize();
    const onMove = (e) => { const pt = e.touches?.[0] || e; mouse.x = pt.clientX; mouse.y = pt.clientY; };
    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });

    function drawBgGradient() {
      const g = ctx.createLinearGradient(0, 0, width, height);
      g.addColorStop(0, t.bgStart); g.addColorStop(1, t.bgEnd);
      ctx.fillStyle = g; ctx.fillRect(0, 0, width, height);
    }

    let prevT = performance.now(); let running = true;
    const step = (ts) => {
      if (!running) return;
      const dt = Math.min((ts - prevT) / 16.6667, 3); prevT = ts;
      drawBgGradient();
      ctx.save(); ctx.globalAlpha = 0.07; ctx.fillStyle = t.grid;
      for (let x = 0; x < width; x += 40) ctx.fillRect(x, 0, 1, height);
      for (let y = 0; y < height; y += 40) ctx.fillRect(0, y, width, 1);
      ctx.restore();

      for (const p of particles) {
        p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;
        const dx = p.x - mouse.x, dy = p.y - mouse.y;
        const d2 = dx*dx + dy*dy, r2 = mouse.r*mouse.r;
        if (d2 < r2) {
          const f = (1 - d2 / r2) * CONFIG.MOUSE_FORCE * dt;
          const inv = 1 / Math.sqrt(d2 + 0.001);
          p.vx += dx * inv * f; p.vy += dy * inv * f;
        }
        p.vx *= CONFIG.DRAG; p.vy *= CONFIG.DRAG;
        const sp = Math.hypot(p.vx, p.vy);
        if (sp > CONFIG.MAX_SPEED) { const s = CONFIG.MAX_SPEED / sp; p.vx *= s; p.vy *= s; }
        ctx.beginPath(); ctx.arc(p.x, p.y, p.s, 0, Math.PI*2);
        ctx.fillStyle = t.particle; ctx.fill();
      }

      ctx.lineWidth = 1;
      for (let i = 0; i < particles.length; i++) for (let j = i+1; j < particles.length; j++) {
        const a = particles[i], b = particles[j];
        const dx = a.x - b.x, dy = a.y - b.y, d2 = dx*dx + dy*dy;
        if (d2 < CONFIG.LINK_DIST * CONFIG.LINK_DIST) {
          const alpha = 1 - d2 / (CONFIG.LINK_DIST * CONFIG.LINK_DIST);
          ctx.strokeStyle = `rgba(${t.lineRGB}, ${alpha})`;
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
        }
      }
      rafRef.current = requestAnimationFrame(step);
    };

    cancelAnimationFrame(rafRef.current);
    prevT = performance.now(); running = true; rafRef.current = requestAnimationFrame(step);

    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("touchmove", onMove);
    };
  }, [active, theme]);

  return <canvas ref={canvasRef} className={`fixed inset-0 -z-10 pointer-events-none [image-rendering:pixelated] transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-0'}`} aria-hidden="true" />;
}
const data = {
  name: "Manuel Linares",
  role: "Python Dev • Machine Learning • Data Analytics",
  blurb: "Mechanical Engineer (Uniandes) & Google Data Analytics certified. I build data products end-to-end: ETL → analysis → ML → dashboards.",
  location: "Bogotá, Colombia",
  email: "manolo9045@gmail.com",
  phone: "+57 320 801 4924",
  links: { github: "https://github.com/ManoLord9408", linkedin: "https://www.linkedin.com/in/manuel-l-023721136/", cv: "/assets/Manuel_Linares_CV.pdf" },
  skills: ["Python (Pandas, NumPy, scikit-learn)", "SQL (Postgres/BigQuery)", "Power BI / Tableau", "ETL & Data Pipelines", "Docker"],
  highlights: [
    { title: "Petcoke Trade Intelligence Dashboard", time: "2025", bullets: ["Automated import/export ETL and CIF/Ton reconciliation", "Power BI dashboards for trends, grades, ports, AIS"], tech: ["Python","Pandas","Power BI","Access"] },
    { title: "ML Classification – Service Catalog", time: "2024", bullets: ["Supervised model to classify services; improved tagging accuracy"], tech: ["scikit-learn","Pandas"] },
  ],
  projects: [
    { name: "FastAPI Portfolio Starter", description: "Starter API & Streamlit front for personal portfolio and data demos.", stack: ["FastAPI","Python","Streamlit"], link: "https://github.com/yourhandle/fastapi-portfolio-starter" },
    { name: "Drone RC Signal Classifier (PoC)", description: "Deep learning PoC to detect RC signal patterns for early drone detection.", stack: ["PyTorch","NumPy"], link: "https://github.com/yourhandle/drone-rc-poc" },
  ],
};
export default function Portfolio() {
  const [open, setOpen] = useState(false);
  const [showFX, setShowFX] = useState(true);
  const [themeKey, setThemeKey] = useState("ocean");
  const theme = safeTheme(themeKey);

  useEffect(() => { try { localStorage.setItem("themeKey", themeKey) } catch {} }, [themeKey]);
  useEffect(() => { try { localStorage.setItem("showFX", String(showFX)) } catch {} }, [showFX]);
  useEffect(() => {
    try {
      const t = localStorage.getItem("themeKey"); if (t && THEMES[t]) setThemeKey(t);
      const fx = localStorage.getItem("showFX"); if (fx !== null) setShowFX(fx !== "false");
    } catch {}
  }, []);

  const cycleTheme = () => { const i = THEME_KEYS.indexOf(themeKey); setThemeKey(THEME_KEYS[(i+1)%THEME_KEYS.length]); };

  return (
    <div className="min-h-screen text-slate-100 relative">
      <div className={`fixed inset-0 -z-20 transition-opacity duration-300 ${showFX ? 'opacity-0' : 'opacity-100'}`} aria-hidden="true" style={{ backgroundImage: `linear-gradient(180deg, ${theme.bgStart}, ${theme.bgEnd})` }} />
      <BackgroundFX active={showFX} theme={theme} />

      <header className={`sticky top-0 z-40 backdrop-blur bg-slate-950/70 border-b ${theme.navBorder}`}>
        <nav className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`h-8 w-8 rounded-xl bg-gradient-to-tr ${theme.logoGrad}`} />
            <span className="font-semibold">{data.name}</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm text-slate-300">
            <a href="#about" className="hover:text-white">About</a>
            <a href="#experience" className="hover:text-white">Experience</a>
            <a href="#projects" className="hover:text-white">Projects</a>
            <a href="#contact" className="hover:text-white">Contact</a>
            <a href={data.links.cv} className={`inline-flex items-center gap-2 border ${theme.chipBorder} px-3 py-1.5 rounded-xl hover:bg-slate-800`}><FileText className="h-4 w-4" /> CV</a>
          </div>
          <button onClick={() => setOpen(!open)} className={`md:hidden border ${theme.chipBorder} px-3 py-1.5 rounded-xl`} aria-expanded={open} aria-controls="mobile-menu" aria-label="Toggle navigation menu">Menu</button>
        </nav>
        {open && (
          <div id="mobile-menu" className={`md:hidden border-t ${theme.navBorder}`}>
            <div className="max-w-6xl mx-auto px-4 py-3 grid gap-2 text-slate-300">
              <a onClick={() => setOpen(false)} href="#about">About</a>
              <a onClick={() => setOpen(false)} href="#experience">Experience</a>
              <a onClick={() => setOpen(false)} href="#projects">Projects</a>
              <a onClick={() => setOpen(false)} href="#contact">Contact</a>
              <a onClick={() => setOpen(false)} href={data.links.cv} className={`inline-flex items-center gap-2 border ${theme.chipBorder} px-3 py-1.5 rounded-xl w-fit`}><FileText className="h-4 w-4" /> CV</a>
            </div>
          </div>
        )}
      </header>

      <section id="about" className="max-w-6xl mx-auto px-4 pt-16 pb-12">
        <div className="grid md:grid-cols-5 gap-8 items-center">
          <div className="md:col-span-3">
            <h1 className="text-3xl md:text-5xl font-bold leading-tight">{data.role}</h1>
            <p className="mt-3 text-slate-200/90 italic">“Turning complex data into actionable insights.”</p>
            <p className="mt-4 text-slate-300 max-w-2xl">{data.blurb}</p>

            <div className="mt-6 flex flex-wrap gap-3">
              <a href={data.links.linkedin} className={`inline-flex items-center gap-2 border ${theme.chipBorder} px-4 py-2 rounded-2xl hover:bg-slate-900`} target="_blank" rel="noopener noreferrer"><Linkedin className="h-4 w-4" /> LinkedIn</a>
              <a href={data.links.github} className={`inline-flex items-center gap-2 border ${theme.chipBorder} px-4 py-2 rounded-2xl hover:bg-slate-900`} target="_blank" rel="noopener noreferrer"><Github className="h-4 w-4" /> GitHub</a>
              <a href="#contact" className={`inline-flex items-center gap-2 ${theme.primaryBtn} text-white px-4 py-2 rounded-2xl`}><Mail className="h-4 w-4" /> Contact me</a>
              <a href={`mailto:${data.email}?subject=${encodeURIComponent('Book a call with Manuel')}&body=${encodeURIComponent("Hi Manuel,\n\nI'd like to book a call to talk about ...\n\nThanks!")}`} className={`inline-flex items-center gap-2 border ${theme.chipBorder} px-4 py-2 rounded-2xl hover:bg-slate-900`} aria-label="Book a call via email"><Phone className="h-4 w-4" /> Book a call</a>
            </div>

            <div className="mt-6 flex flex-wrap gap-2 text-xs">
              {data.skills.map(s => <span key={s} className={`px-3 py-1 rounded-xl ${theme.chipBg} ${theme.chipBorder} border`}>{s}</span>)}
            </div>
          </div>

          <div className="md:col-span-2">
            <div className={`rounded-3xl border ${theme.chipBorder} bg-gradient-to-b from-slate-900 to-slate-950 p-6 shadow-2xl`}>
              <div className="text-sm text-slate-400 flex items-center gap-2"><MapPin className="h-4 w-4" />{data.location}</div>
              <div className="mt-4 grid gap-3 text-slate-200">
                <a href={`mailto:${data.email}`} className="flex items-center gap-2 hover:text-white"><Mail className="h-4 w-4" />{data.email}</a>
                <a href={`tel:${data.phone}`} className="flex items-center gap-2 hover:text-white"><Phone className="h-4 w-4" />{data.phone}</a>
                <a href={data.links.cv} className="flex items-center gap-2 hover:text-white"><Download className="h-4 w-4" />Download CV</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="experience" className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-xl font-semibold mb-6">Experience & Highlights</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {data.highlights.map(h => (
            <article key={h.title} className={`rounded-2xl border ${theme.chipBorder} p-5 ${theme.chipBg}`}>
              <div className="text-xs text-slate-400">{h.time}</div>
              <h3 className="mt-1 font-medium">{h.title}</h3>
              <ul className="mt-2 text-sm list-disc pl-5 space-y-1 text-slate-300">
                {h.bullets.map((b,i) => <li key={i}>{b}</li>)}
              </ul>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {h.tech.map(t => <span key={t} className={`px-2 py-0.5 rounded-lg ${theme.chipBg} ${theme.chipBorder} border`}>{t}</span>)}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section id="projects" className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-xl font-semibold mb-6">Projects</h2>
        <div className="grid md:grid-cols-2 gap-6">
          {data.projects.map(p => (
            <article key={p.name} className={`rounded-2xl border ${theme.chipBorder} p-5 ${theme.chipBg}`}>
              <h3 className="font-medium">{p.name}</h3>
              <p className="mt-2 text-sm text-slate-300">{p.description}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {p.stack.map(t => <span key={t} className={`px-2 py-0.5 rounded-lg ${theme.chipBg} ${theme.chipBorder} border`}>{t}</span>)}
              </div>
              <a href={p.link} className={`mt-4 inline-flex items-center gap-2 ${theme.link}`} target="_blank" rel="noopener noreferrer">Visit <ExternalLink className="h-4 w-4" /></a>
            </article>
          ))}
        </div>
      </section>

      <section id="contact" className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-xl font-semibold mb-4">Get in touch</h2>
        <p className="text-slate-300 max-w-2xl">Whether you have a role in mind or want to discuss a problem, I’m happy to help. The fastest way is email.</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <a href={`mailto:${data.email}`} className={`inline-flex items-center gap-2 ${theme.primaryBtn} text-white px-4 py-2 rounded-2xl`}><Mail className="h-4 w-4" />Email</a>
          <a href={data.links.linkedin} className={`inline-flex items-center gap-2 border ${theme.chipBorder} px-4 py-2 rounded-2xl hover:bg-slate-900`} target="_blank" rel="noopener noreferrer"><Linkedin className="h-4 w-4" />LinkedIn</a>
          <a href={data.links.github} className={`inline-flex items-center gap-2 border ${theme.chipBorder} px-4 py-2 rounded-2xl hover:bg-slate-900`} target="_blank" rel="noopener noreferrer"><Github className="h-4 w-4" />GitHub</a>
        </div>
      </section>

      <footer className="border-t border-slate-800 py-6 text-center text-xs text-slate-400">© {new Date().getFullYear()} {data.name}. Built with React + Tailwind.</footer>

      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 items-end">
        <button onClick={cycleTheme} className={`text-xs border ${theme.chipBorder} bg-slate-900/70 hover:bg-slate-800 px-3 py-1.5 rounded-xl inline-flex items-center gap-2`} title="Cycle theme colors"><Palette className="h-3.5 w-3.5" /> Theme: {theme.name}</button>
        <button role="switch" aria-checked={showFX} aria-label="Toggle animated background" onClick={() => setShowFX(s => !s)} className={`text-xs border ${theme.chipBorder} bg-slate-900/70 hover:bg-slate-800 px-3 py-1.5 rounded-xl`} title={showFX ? "Turn off background" : "Turn on background"}>{showFX ? "Background: ON" : "Background: OFF"}</button>
      </div>
    </div>
  );
}
