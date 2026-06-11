import { motion, AnimatePresence } from "framer-motion";
import { Upload, Loader2, Download, Lock, Sparkles, ChevronDown, ChevronUp, Heart, ArrowUpRight, LogIn } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import { fal } from "@fal-ai/client";
import { useTranslation } from "react-i18next";
import { Link } from "@tanstack/react-router";
import { SectionHeader } from "./SectionHeader";
import t1 from "@/assets/template/1 (1).jpg";
import t3 from "@/assets/template/3 (1).jpg";
import t4 from "@/assets/template/4 (1).jpg";
import t5 from "@/assets/template/5 (1).jpg";
import { templatePrompts } from "@/data/templateData";
import { useAuth } from "@/components/AuthProvider";
import { saveGenerationToHistory, toggleSaveGeneration } from "@/lib/storage";
import { useSubscription } from "@/hooks/useSubscription";
import { getNextUpgrade, PLAN_CONFIG } from "@/lib/subscription";
import { openCheckout } from "@/lib/paddle-client";
import { supabase } from "@/lib/supabase";

// Dynamic import for templates 1-19
const templateModules = import.meta.glob("../../assets/template/1-19/**/*.{png,jpg,jpeg}", { eager: true });
const templateImageMap: Record<string, string> = {};

Object.entries(templateModules).forEach(([path, module]: [string, any]) => {
  const match = path.match(/New folder - Copy \((\d+)\)/);
  if (match) {
    const num = parseInt(match[1]);
    // Map Copy (0) to template-1, Copy (1) to template-2, ..., Copy (18) to template-19
    if (num >= 0 && num < 19) {
      const id = `template-${num + 1}`;
      templateImageMap[id] = module.default || module;
    }
  }
});

// Dynamic import for templates s2 (0-50)
const s2Modules = import.meta.glob("../../assets/template/s2/*.{png,jpg,jpeg}", { eager: true });
const s2ImageMap: Record<string, string> = {};

Object.entries(s2Modules).forEach(([path, module]: [string, any]) => {
  const match = path.match(/\/(\d+)\.(png|jpg|jpeg)$/);
  if (match) {
    const num = parseInt(match[1]);
    if (num >= 0 && num <= 50) {
      const id = `s2-${num}`;
      s2ImageMap[id] = module.default || module;
    }
  }
});

const getItems = (t: any) => {
  const baseItems = [
    { id: "noir-elegance", img: t3, title: t('tmpl_noir_elegance'), category: t('cat_fashion'), span: "row-span-2" },
    { id: "forest-dew", img: t1, title: t('tmpl_forest_dew'), category: t('cat_beauty'), span: "row-span-2" },
    { id: "desert-oud", img: t4, title: t('tmpl_desert_oud'), category: t('cat_luxury'), span: "row-span-2" },
    { id: "stone-minimal", img: t5, title: t('tmpl_stone_minimal'), category: t('cat_lifestyle'), span: "row-span-2" },
  ];

  const newItems = Object.keys(templateImageMap)
    .sort((a, b) => {
      const numA = parseInt(a.split("-")[1]);
      const numB = parseInt(b.split("-")[1]);
      return numA - numB;
    })
    .map(id => ({
      id,
      img: templateImageMap[id],
      title: `${t('template')} ${id.split("-")[1]}`,
      category: t('cat_all'),
      span: "row-span-2"
    }));

  const s2Items = Object.keys(s2ImageMap)
    .sort((a, b) => {
      const numA = parseInt(a.split("-")[1]);
      const numB = parseInt(b.split("-")[1]);
      return numB - numA;
    })
    .map(id => ({
      id,
      img: s2ImageMap[id],
      title: `${t('template')} S2-${id.split("-")[1]}`,
      category: t('cat_all'),
      span: "row-span-2"
    }));

  return [...s2Items, ...baseItems, ...newItems];
};

const getCategories = (t: any) => [
  { id: 'All', label: t('cat_all') },
  { id: t('cat_fashion'), label: t('cat_fashion') },
  { id: t('cat_beauty'), label: t('cat_beauty') },
  { id: t('cat_tech'), label: t('cat_tech') },
  { id: t('cat_luxury'), label: t('cat_luxury') },
  { id: t('cat_food'), label: t('cat_food') },
  { id: t('cat_lifestyle'), label: t('cat_lifestyle') }
];

fal.config({
  proxyUrl: "/api/fal-proxy",
  requestMiddleware: async (request) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        request.headers = {
          ...request.headers,
          Authorization: `Bearer ${session.access_token}`,
        };
      }
    } catch (err) {
      console.warn("Failed to attach auth token to Fal request", err);
    }
    return request;
  }
});

export function TemplateGallery() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { usage, planKey, planName, generationLimit, refresh: refreshSubscription } = useSubscription();
  const [active, setActive] = useState("All");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [localGenerationCount, setLocalGenerationCount] = useState<number>(0);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavedToHistory, setIsSavedToHistory] = useState(false);
  const [resultData, setResultData] = useState<{
    templateImg: string;
    productImg: string;
    resultImg: string;
    templateId?: string;
    prompt?: string;
    generationId?: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Use subscription-aware count when logged in, fallback to localStorage for guests
  const generationCount = usage?.used ?? localGenerationCount;
  const currentLimit = usage?.limit ?? generationLimit;

  const nextUpgrade = getNextUpgrade(planKey);
  const nextPlan = nextUpgrade ? PLAN_CONFIG[nextUpgrade] : null;

  useEffect(() => {
    const localCount = parseInt(localStorage.getItem("generation_count") || "0", 10);
    const sessionCount = parseInt(sessionStorage.getItem("generation_count") || "0", 10);
    const maxCount = Math.max(localCount, sessionCount);
    
    setLocalGenerationCount(maxCount);
    toast.dismiss("gen-toast");
    
    // Developer reset function
    (window as any).resetGenerationLimit = () => {
      localStorage.setItem("generation_count", "0");
      sessionStorage.setItem("generation_count", "0");
      setLocalGenerationCount(0);
      setShowLimitModal(false);
      console.log("Generation limit reset to 0.");
    };
  }, []);

  useEffect(() => {
    if (resultData) {
      setTimeout(() => {
        document.getElementById('final-result')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    }
  }, [resultData]);

  const processGeneration = async (productFile: File, templateImgSrc: string) => {
    if (generationCount >= currentLimit) {
      setShowLimitModal(true);
      return;
    }

    try {
      setIsProcessing(true);
      toast.loading(t('result_generating'), { id: "gen-toast" });

      const productLocalUrl = URL.createObjectURL(productFile);

      // Download and prepare the template image
      const tmplRes = await fetch(templateImgSrc);
      const tmplBlob = await tmplRes.blob();
      const tmplFile = new File([tmplBlob], "template.jpg", { type: tmplBlob.type });

      // Upload both files to Fal CDN in parallel
      const [templateUpload, productUpload] = await Promise.all([
        fal.storage.upload(tmplFile),
        fal.storage.upload(productFile)
      ]);

      let inputPayload: any = {};
      const isNewTemplate = selectedTemplate?.startsWith("template-") || selectedTemplate?.startsWith("s2-");

      if (isNewTemplate) {
        const specificPrompt = templatePrompts[selectedTemplate as string] || `
Replace the product in the template using the uploaded product image.
Maintain exact shadows, reflections, perspective, lighting,
camera angle, and commercial advertising style.
Ultra realistic product photography.`;

        inputPayload = {
          prompt: `Image 1 is the template, Image 2 is the product. ${specificPrompt}`,
          image_urls: [templateUpload, productUpload],
          aspect_ratio: "4:5",
          num_images: 1,
          output_format: "png",
          safety_tolerance: "2",
          sync_mode: true
        };
      } else {
        inputPayload = {
          prompt: `Image 1 is the template, Image 2 is the product. Replace the product in the template using the uploaded product image.
Maintain exact shadows, reflections, perspective, lighting,
camera angle, and commercial advertising style.
Ultra realistic product photography.`,
          image_urls: [templateUpload, productUpload],
          aspect_ratio: "4:5",
          num_images: 1,
          output_format: "png",
          safety_tolerance: "2",
          sync_mode: true
        };
      }

      const result = await fal.subscribe("fal-ai/nano-banana-2/edit", {
        input: inputPayload
      });

      let generationId: string | undefined = undefined;
      let finalProductImg = productLocalUrl;
      let finalResultImg = result.data.images[0].url;
      let finalTemplateImg = templateImgSrc;

      if (user) {
        // Automatically save to DB (with isSaved: false) and increment count in DB
        const savedRecord = await saveGenerationToHistory({
          userId: user.id,
          templateId: selectedTemplate || 'unknown',
          templateImageUrl: templateImgSrc,
          productImageUrl: productLocalUrl,
          resultImageUrl: result.data.images[0].url,
          prompt: typeof inputPayload.prompt === 'string' ? inputPayload.prompt : '',
          isSaved: false,
        });
        generationId = savedRecord.id;
        // Keep using the direct Fal API URL on the frontend result screen
        finalResultImg = result.data.images[0].url;
      } else {
        // Increment guest local count
        const newCount = localGenerationCount + 1;
        setLocalGenerationCount(newCount);
        localStorage.setItem("generation_count", newCount.toString());
        sessionStorage.setItem("generation_count", newCount.toString());
      }

      setResultData({
        templateImg: finalTemplateImg,
        productImg: finalProductImg,
        resultImg: finalResultImg,
        templateId: selectedTemplate || undefined,
        prompt: typeof inputPayload.prompt === 'string' ? inputPayload.prompt : undefined,
        generationId,
      });
      setIsSavedToHistory(false);

      // Refresh subscription data to get updated server-side count
      await refreshSubscription();

      toast.success(t('gallery_upload_success'), { id: "gen-toast" });

    } catch (error: any) {
      console.error("Fal AI Generation Error:", error);
      toast.error(`${t('result_error')} - ${error?.message || 'Unknown error'}`, { id: "gen-toast", duration: 10000 });
    } finally {
      setIsProcessing(false);
      setSelectedTemplate(null);
      setTimeout(() => toast.dismiss("gen-toast"), 5000);
    }
  };

  const handleUploadClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!isProcessing) {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0 && selectedTemplate && !isProcessing) {
      const file = e.target.files[0];
      const templateItem = items.find(it => it.id === selectedTemplate);
      if (templateItem) {
        processGeneration(file, templateItem.img);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0 && selectedTemplate && !isProcessing) {
      const file = e.dataTransfer.files[0];
      const templateItem = items.find(it => it.id === selectedTemplate);
      if (templateItem) {
        processGeneration(file, templateItem.img);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };
  const items = getItems(t);
  const categories = getCategories(t);
  const filtered = active === "All" ? items : items.filter((i) => i.category === active);
  const INITIAL_COUNT = 10;
  const hasMore = filtered.length > INITIAL_COUNT;
  const visibleItems = showAll ? filtered : filtered.slice(0, INITIAL_COUNT);



  return (
    <section id="templates" className="relative py-32">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex justify-center mb-6">
          {(() => {
            const remaining = Math.max(0, currentLimit - generationCount);
            const remainingText =
              remaining === 0
                ? t('limit_reached')
                : remaining === 1
                ? t('limit_remaining_1')
                : `${remaining}/${currentLimit} ${t('limit_remaining_n')}`;
            return (
              <div className={`px-4 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md border flex items-center gap-2 ${remaining > 0 ? 'bg-primary/10 border-primary/20 text-primary shadow-[0_0_15px_var(--glow)]' : 'bg-destructive/10 border-destructive/20 text-destructive'}`}>
                {remaining === 0 ? <Lock className="w-3.5 h-3.5" /> : <Sparkles className="w-3.5 h-3.5" />}
                {remainingText}
                {planKey !== 'free' && (
                  <span className="text-[10px] uppercase tracking-wider opacity-70">({planName})</span>
                )}
              </div>
            );
          })()}
        </div>

        <div className="relative">
          <div className="mt-12 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {visibleItems.map((it, i) => {
            return (
            <motion.div
              key={it.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.05 }}
              onClick={() => setSelectedTemplate(selectedTemplate === it.id ? null : it.id)}
              className={`group ring-border-gradient relative overflow-hidden rounded-2xl shadow-card cursor-pointer transition-all w-full aspect-[4/5] ${selectedTemplate === it.id ? 'ring-primary shadow-glow' : ''}`}
            >
              <img
                src={it.img}
                alt={it.title}
                loading="lazy"
                className={`absolute inset-0 h-full w-full object-cover transition-all duration-[900ms] ease-out ${selectedTemplate === it.id ? 'scale-110 opacity-30 blur-md grayscale' : 'group-hover:scale-110'}`}
              />

              <AnimatePresence mode="wait">
                {selectedTemplate === it.id ? (
                  <motion.div
                    key="upload-overlay"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={handleUploadClick}
                    className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center z-10 hover:bg-background/70 bg-background/60 backdrop-blur-md transition-colors"
                  >
                    {isProcessing ? (
                      <div className="flex flex-col items-center">
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-primary shadow-[0_0_20px_var(--glow)] ring-1 ring-primary/40 mb-3">
                          <Loader2 className="h-6 w-6 animate-spin" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">{t('result_generating')}</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-primary shadow-[0_0_20px_var(--glow)] ring-1 ring-primary/40 mb-3 animate-pulse">
                          <Upload className="h-6 w-6" />
                        </div>
                        <p className="text-sm font-semibold text-foreground">{t('gallery_upload_product')}</p>
                        <p className="text-[11px] text-muted-foreground mt-1 max-w-[80%] leading-relaxed">{t('gallery_upload_desc')}</p>
                        <button
                          type="button"
                          className="mt-4 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-elegant"
                        >
                          {t('gallery_browse')}
                        </button>
                      </>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="info-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-10 pointer-events-none"
                  >
                    {/* Centered Select Button */}


                    {/* Bottom Info */}

                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )})}
          </div>

          {/* Gradient Fade Overlay (when collapsed) */}
          {hasMore && !showAll && (
            <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-background via-background/80 to-transparent" />
          )}
        </div>

        {/* Explore More / Show Less Button */}
        {hasMore && (
          <div className="flex justify-center mt-10">
            <motion.button
              type="button"
              onClick={() => setShowAll(!showAll)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative flex items-center gap-2.5 rounded-full glass border border-white/10 px-8 py-3.5 text-sm font-semibold text-foreground hover:border-primary/30 hover:shadow-[0_0_25px_var(--glow)] transition-all duration-300 cursor-pointer"
            >
              <span className="absolute inset-0 rounded-full bg-primary/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
              <span className="relative z-10">{showAll ? t('gallery_show_less') : t('gallery_explore')}</span>
              <span className="relative z-10">
                {showAll ? <ChevronUp className="w-4 h-4 transition-transform duration-300" /> : <ChevronDown className="w-4 h-4 transition-transform duration-300 group-hover:translate-y-0.5" />}
              </span>
              {!showAll && (
                <span className="relative z-10 ml-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-primary/20 px-1.5 text-[10px] font-bold text-primary">
                  +{filtered.length - INITIAL_COUNT}
                </span>
              )}
            </motion.button>
          </div>
        )}


        {/* Result Section */}
        {resultData && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mt-32 border-t border-white/5 pt-20"
            id="result-section"
          >
            <SectionHeader eyebrow={t('result_eyebrow')} title={t('result_title')} />
            <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch max-w-5xl mx-auto">
              {/* Template */}
              <div className="glass p-4 rounded-3xl flex flex-col items-center justify-between border border-white/5 bg-white/5 relative overflow-hidden group">
                <span className="text-[10px] text-muted-foreground mb-4 uppercase tracking-[0.2em] font-medium z-10 bg-background/80 px-3 py-1 rounded-full backdrop-blur-md">{t('result_template')}</span>
                <img src={resultData.templateImg} className="rounded-2xl w-full aspect-[4/5] object-cover transition-transform duration-700 group-hover:scale-105" />
              </div>

              {/* Product */}
              <div className="glass p-4 rounded-3xl flex flex-col items-center justify-between border border-white/5 bg-white/5 relative overflow-hidden group">
                <span className="text-[10px] text-muted-foreground mb-4 uppercase tracking-[0.2em] font-medium z-10 bg-background/80 px-3 py-1 rounded-full backdrop-blur-md">{t('result_product')}</span>
                <div className="w-full aspect-[4/5] bg-white/5 rounded-2xl p-4 flex items-center justify-center">
                  <img src={resultData.productImg} className="max-w-full max-h-full object-contain drop-shadow-2xl transition-transform duration-700 group-hover:scale-110" />
                </div>
              </div>

              {/* Result */}
              <div id="final-result" className="ring-border-gradient p-1 rounded-3xl relative shadow-[0_0_40px_var(--glow)] overflow-hidden group">
                <div className="bg-background rounded-[22px] p-4 flex flex-col items-center h-full relative z-10">
                  <span className="text-[10px] text-primary font-bold mb-4 uppercase tracking-[0.2em] animate-pulse bg-primary/10 px-3 py-1 rounded-full">{t('result_final')}</span>
                  <img src={resultData.resultImg} className="rounded-2xl w-full aspect-[4/5] object-cover" />

                  <div className="absolute bottom-8 right-8 flex items-center gap-2">
                    {user && (
                      <button
                        onClick={async () => {
                          if (!resultData || isSaving || isSavedToHistory || !resultData.generationId) return;
                          setIsSaving(true);
                          try {
                            await toggleSaveGeneration(resultData.generationId, true);
                            setIsSavedToHistory(true);
                            toast.success(t('dash_toast_saved'));
                          } catch (err) {
                            console.error('Save failed:', err);
                            toast.error(t('dash_toast_error'));
                          } finally {
                            setIsSaving(false);
                          }
                        }}
                        disabled={isSaving || isSavedToHistory || !resultData.generationId}
                        className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 ${
                          isSavedToHistory
                            ? 'bg-green-500 text-white shadow-[0_0_20px_rgba(34,197,94,0.4)]'
                            : 'bg-white/20 text-white backdrop-blur-md hover:bg-primary hover:shadow-glow hover:scale-105'
                        } disabled:opacity-70`}
                        title={isSavedToHistory ? t('dash_saved') : t('gallery_save_to_history')}
                      >
                        {isSaving ? (
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <Heart className={`h-5 w-5 ${isSavedToHistory ? 'fill-current' : ''}`} />
                        )}
                      </button>
                    )}
                    <a
                      href={resultData.resultImg}
                      download="generated-ad.png"
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-glow hover:scale-105 transition-transform"
                    >
                      <Download className="h-5 w-5" />
                    </a>
                  </div>
                </div>
                <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[2rem] bg-primary/20 opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100" />
              </div>
            </div>
          </motion.div>
        )}

        {/* Limit Reached Modal */}
        <AnimatePresence>
          {showLimitModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="glass border border-white/10 p-8 rounded-3xl max-w-md w-full shadow-2xl relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                <div className="relative z-10 flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-destructive/10 text-destructive flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,0,0,0.15)] ring-1 ring-destructive/30">
                     <Lock className="w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{t('modal_limit_headline')}</h2>
                  <p className="text-muted-foreground mb-8 leading-relaxed">
                    {t('modal_limit_desc')}
                    {planKey !== 'free' && ` (${planName} — ${currentLimit} ${t('limit_remaining_n')})`}
                  </p>
                  <div className="flex flex-col w-full gap-3">
                     {!user ? (
                       <Link
                         to="/login"
                         className="w-full py-3 rounded-full bg-accent-gradient text-primary-foreground font-semibold hover:opacity-95 transition-all shadow-glow flex items-center justify-center gap-2"
                       >
                          {t('nav_signin')}
                          <LogIn className="h-4 w-4" />
                       </Link>
                     ) : nextPlan ? (
                       <button
                         type="button"
                         onClick={async () => {
                           if (!nextPlan || !nextUpgrade) return;
                           const nextTierConfig = PLAN_CONFIG[nextUpgrade];
                           if (nextTierConfig && nextTierConfig.priceId) {
                             try {
                               await openCheckout(nextTierConfig.priceId, user?.id || "", user?.email || "");
                             } catch (err: any) {
                               console.error("Checkout error:", err);
                               toast.error(err.message || "Failed to open checkout.");
                             }
                           } else {
                             toast.error("Upgrade not available yet.");
                           }
                         }}
                         className="w-full py-3 rounded-full bg-accent-gradient text-primary-foreground font-semibold hover:opacity-95 transition-all shadow-glow flex items-center justify-center gap-2"
                       >
                          {t('modal_btn_upgrade')} — {nextPlan.name} (${nextPlan.price}/{t('pricing_mo')})
                          <ArrowUpRight className="h-4 w-4" />
                       </button>
                     ) : (
                       <button 
                          type="button"
                          onClick={() => window.open("mailto:support@example.com", "_blank")}
                          className="w-full py-3 rounded-full bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors shadow-elegant"
                        >
                           {t('modal_btn_contact')}
                        </button>
                      )}
                     <button 
                       type="button"
                       onClick={() => setShowLimitModal(false)}
                       className="w-full py-3 rounded-full glass border border-white/10 font-semibold hover:bg-white/5 transition-colors"
                     >
                        {t('modal_btn_contact')}
                     </button>
                     <button onClick={() => window.location.reload()} className="text-xs text-muted-foreground hover:text-foreground mt-4 transition-colors">
                        {t('modal_btn_refresh')}
                      </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
