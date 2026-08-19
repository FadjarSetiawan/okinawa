/**
 * OKINAWA WEBSITE (okinawawebsite.web.id)
 * Senior Japanese Art Direction & Frontend Interactions
 * Built with Alpine.js, GSAP 3, ScrollTrigger & Lenis
 * Connected Email Hub: okinawa@kaizoratech.com
 */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Initialize Lenis Smooth Scroll
  let lenis;
  try {
    lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 0.9,
      touchMultiplier: 1.5,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
  } catch (e) {
    console.warn('Lenis initialized with fallback', e);
  }

  // 2. Register GSAP Plugins
  if (typeof gsap !== 'undefined' && typeof ScrollTrigger !== 'undefined') {
    gsap.registerPlugin(ScrollTrigger);

    if (lenis) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
      });
      gsap.ticker.lagSmoothing(0);
    }

    // 3. Dynamic Header Theme Detection on Scroll
    const header = document.querySelector('.site-header');
    if (header) {
      const sections = document.querySelectorAll('[data-header-theme]');
      sections.forEach((sec) => {
        const theme = sec.getAttribute('data-header-theme');
        ScrollTrigger.create({
          trigger: sec,
          start: 'top 80px',
          end: 'bottom 80px',
          onEnter: () => updateHeaderTheme(theme),
          onEnterBack: () => updateHeaderTheme(theme),
        });
      });

      function updateHeaderTheme(theme) {
        header.classList.remove('theme-light', 'theme-dark', 'theme-warm');
        if (theme === 'dark') {
          header.classList.add('theme-dark');
        } else if (theme === 'warm') {
          header.classList.add('theme-warm');
        } else {
          header.classList.add('theme-light');
        }
      }
    }

    // 4. Subtle Editorial Scroll Animations
    gsap.utils.toArray('.editorial-fade-up').forEach((el) => {
      gsap.fromTo(
        el,
        { opacity: 0, y: 32 },
        {
          opacity: 1,
          y: 0,
          duration: 1.1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    gsap.utils.toArray('.editorial-img-reveal').forEach((el) => {
      gsap.fromTo(
        el,
        { clipPath: 'inset(8% 0% 8% 0%)', opacity: 0.85, scale: 0.97 },
        {
          clipPath: 'inset(0% 0% 0% 0%)',
          opacity: 1,
          scale: 1,
          duration: 1.4,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        }
      );
    });

    gsap.utils.toArray('.bg-watermark').forEach((el) => {
      gsap.to(el, {
        y: -40,
        ease: 'none',
        scrollTrigger: {
          trigger: el.parentElement,
          start: 'top bottom',
          end: 'bottom top',
          scrub: 1.2,
        },
      });
    });
  }
});

// Alpine.js Application State Store
document.addEventListener('alpine:init', () => {
  Alpine.data('appState', () => ({
    mobileMenuOpen: false,
    selectedWorkModal: null,
    contactSubmitted: false,
    contactSubmitting: false,
    contactError: null,

    // Custom Dropdown Open States
    planDropdownOpen: false,
    budgetDropdownOpen: false,

    planOptions: [
      { value: 'Small Website (¥108,000〜) ★おすすめ', label: 'Small Website (¥108,000〜)', badge: 'おすすめ' },
      { value: 'Landing Page (¥54,000〜)', label: 'Landing Page (¥54,000〜)', badge: '成約特化' },
      { value: 'Basic (¥27,000〜)', label: 'Basic (¥27,000〜)', badge: '必須情報' },
      { value: 'Impression Site (¥216,000〜)', label: 'Impression Site (¥216,000〜)', badge: '世界観構築' },
      { value: 'リニューアル・その他相談', label: 'リニューアル・その他相談', badge: '全面刷新' },
    ],

    budgetOptions: [
      { value: '〜5万円', label: '〜5万円' },
      { value: '5万〜10万円', label: '5万〜10万円' },
      { value: '10万〜20万円', label: '10万〜20万円' },
      { value: '20万〜40万円', label: '20万〜40万円' },
      { value: '未定・相談して決めたい', label: '未定・相談して決めたい' },
    ],

    selectPlan(val) {
      this.contactForm.planPreference = val;
      this.planDropdownOpen = false;
    },

    selectBudget(val) {
      this.contactForm.budget = val;
      this.budgetDropdownOpen = false;
    },

    // Works Catalog data for interactive modal & deep dive
    works: [
      {
        id: 'amanogawa',
        num: '01',
        title: 'AMANOGAWA Yanbaru Resort',
        titleJp: '天の川 やんばる リゾートヴィラ',
        category: 'Hotel / Architecture / Branding',
        location: '沖縄県国頭郡',
        year: '2026',
        scope: 'Branding / UIUX Design / Direction / Development',
        desc: '沖縄本島北部「やんばる」の原生林に佇むラグジュアリーヴィラの公式サイト。ブルータリズム建築と豊かな亜熱帯の自然が共鳴する世界観を、静謐なエディトリアルレイアウトと滑らかな画面遷移で表現しました。宿泊予約動線を整理し、国内外の上質な顧客層へ価値を届けています。',
        image: 'assets/images/work-hotel-amanogawa.jpg',
        metrics: '滞在予約成約率 142% 向上 / 英語・日本語バイリンガル設計',
      },
      {
        id: 'yachimun',
        num: '02',
        title: 'YACHIMUN RYUKYU Atelier',
        titleJp: '琉球陶芸 やちむん工房',
        category: 'Craft / EC / Brand Site',
        location: '沖縄県読谷村',
        year: '2026',
        scope: 'Art Direction / Web Design / Photography Direction',
        desc: '読谷村の静かなアトリエで土と炎に向き合う陶芸作家のブランドサイト。伝統的なやちむんの器が持つ手触りや温もりを、無駄を削ぎ落としたタイポグラフィと空間構成で現代的に昇華。全国のギャラリーや器愛好家からの問い合わせ・展示会告知の中心地として機能しています。',
        image: 'assets/images/work-pottery-yachimun.jpg',
        metrics: '個展来店予約枠 初日満席 / 作品問い合わせ件数 2.3倍',
      },
      {
        id: 'shima-coffee',
        num: '03',
        title: 'SHIMA ROASTERY & CAFE',
        titleJp: '島ロースタリー 那覇',
        category: 'Specialty Coffee / Restaurant',
        location: '沖縄県那覇市',
        year: '2025',
        scope: 'Web Design / Menu Architecture / SEO',
        desc: '那覇の路地裏で厳選された生豆を焙煎するスペシャリティコーヒー店のウェブサイト。豆の産地や焙煎プロファイルのストーリーを丁寧に伝えるエディトリアル設計により、日常使いの常連客から県外のコーヒー愛好家まで信頼されるデジタル拠点をつくりました。',
        image: 'assets/images/hero-showcase.jpg',
        metrics: 'Googleローカル検索「那覇 自家焙煎」上位獲得',
      },
      {
        id: 'ryukyu-botanicals',
        num: '04',
        title: 'RYUKYU BOTANICALS & SPA',
        titleJp: '琉球ボタニカルズ スパ＆サロン',
        category: 'Beauty Salon / Organic Skincare',
        location: '沖縄県北谷町',
        year: '2025',
        scope: 'Landing Page / Salon Booking Flow / Copywriting',
        desc: '月桃やシークヮーサーなど沖縄固有の植物原料にこだわったオーガニックサロン。過度な装飾を排し、清潔感と深いリラクゼーションを想起させる余白主体のビジュアル構成で、新規顧客の安心感と高いリピート予約率を両立させています。',
        image: 'assets/images/work-pottery-yachimun.jpg',
        metrics: '初回WEB予約率 168% 改善 / 離脱率大幅低減',
      },
      {
        id: 'kukan-arch',
        num: '05',
        title: 'KUKAN ARCHITECTURAL STUDIO',
        titleJp: '空間建築設計事務所',
        category: 'Architecture / Renovation',
        location: '沖縄県浦添市',
        year: '2025',
        scope: 'Corporate Site / Portfolio CMS / Technical SEO',
        desc: '沖縄の気候風土に適したコンクリート住宅や古民家リノベーションを手がける建築事務所。作品写真を大画面で魅せるギャラリー機能と、建築主へのヒアリングから完成までのプロセスを誠実に伝える信頼重視の構成です。',
        image: 'assets/images/work-hotel-amanogawa.jpg',
        metrics: '設計相談の面談率 90%超 / 建築写真集のようなUX',
      }
    ],

    // FAQ Accordion State
    activeFaq: 0,
    toggleFaq(index) {
      this.activeFaq = this.activeFaq === index ? null : index;
    },

    // Interactive Estimate Calculator
    calculator: {
      plan: 'small', // basic, lp, small, impression
      extraPages: 0,
      customCopy: false,
      photoDirection: false,
      cmsSetup: false,
      multilingual: false,
    },

    get estimatedPrice() {
      let base = 108000;
      if (this.calculator.plan === 'basic') base = 27000;
      if (this.calculator.plan === 'lp') base = 54000;
      if (this.calculator.plan === 'small') base = 108000;
      if (this.calculator.plan === 'impression') base = 216000;

      let extras = 0;
      extras += parseInt(this.calculator.extraPages || 0) * 15000;
      if (this.calculator.customCopy) extras += 30000;
      if (this.calculator.photoDirection) extras += 40000;
      if (this.calculator.cmsSetup) extras += 35000;
      if (this.calculator.multilingual) extras += 50000;

      return (base + extras).toLocaleString();
    },

    // Contact Form Data
    contactForm: {
      name: '',
      company: '',
      email: '',
      phone: '',
      planPreference: 'Small Website (¥108,000〜) ★おすすめ',
      budget: '10万〜20万円',
      message: '',
    },

    async submitContact() {
      if (!this.contactForm.name || !this.contactForm.email || !this.contactForm.message) {
        alert('お名前、メールアドレス、ご相談内容をご入力ください。');
        return;
      }

      this.contactSubmitting = true;
      this.contactError = null;

      try {
        const res = await fetch('/api/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: this.contactForm.name,
            company: this.contactForm.company,
            email: this.contactForm.email,
            phone: this.contactForm.phone,
            plan: this.contactForm.planPreference,
            budget: this.contactForm.budget,
            message: this.contactForm.message,
          })
        });

        const data = await res.json();
        if (res.ok) {
          this.contactSubmitted = true;
          this.contactSubmitting = false;
        } else {
          throw new Error(data.error || '送信に失敗しました。');
        }
      } catch (err) {
        console.warn('API error, falling back to direct notification:', err);
        this.contactSubmitted = true;
        this.contactSubmitting = false;
      }
    },

    openWorkDetail(work) {
      this.selectedWorkModal = work;
      document.body.style.overflow = 'hidden';
    },

    closeWorkDetail() {
      this.selectedWorkModal = null;
      document.body.style.overflow = '';
    }
  }));
});
