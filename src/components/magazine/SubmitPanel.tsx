"use client";

import { useState, useRef, useEffect } from "react";
import KanthaDivider from "@/components/ui/KanthaDivider";
import { useAuthContext } from "@/providers/AuthProvider";

/* ------------------------------------------------------------------ */
/*  Image compression                                                  */
/* ------------------------------------------------------------------ */

const MAX_DIMENSION = 2000;
const JPEG_QUALITY = 0.85;
const MAX_FILE_SIZE = 1.5 * 1024 * 1024; // 1.5MB — compress anything larger

function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    if (file.size <= MAX_FILE_SIZE && file.type === "image/jpeg") {
      resolve(file);
      return;
    }
    const img = new Image();
    img.onload = () => {
      const { width, height } = img;
      const scale = Math.min(1, MAX_DIMENSION / Math.max(width, height));
      const w = Math.round(width * scale);
      const h = Math.round(height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const name = file.name.replace(/\.\w+$/, ".jpg");
            resolve(new File([blob], name, { type: "image/jpeg" }));
          } else {
            resolve(file);
          }
        },
        "image/jpeg",
        JPEG_QUALITY
      );
    };
    img.onerror = () => resolve(file);
    img.src = URL.createObjectURL(file);
  });
}

async function compressFiles(files: File[]): Promise<File[]> {
  return Promise.all(files.map((f) => (f.type.startsWith("image/") ? compressImage(f) : Promise.resolve(f))));
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Category = "Letters" | "Photography" | "Art" | "Comics";
type ComicType = "single" | "multi";

interface PhotoEntry {
  file: File | null;
  caption: string;
  title: string;
  medium: string;
  panels: File[];
}

const CATEGORIES: Category[] = ["Letters", "Photography", "Art", "Comics"];
const FLAVOR_TAGS = ["Culture", "Faith", "Travel", "Food", "Identity", "Memory", "Belonging"];
const TYPE_TAGS = ["Prose", "Poem", "Memoir", "Essay", "Fiction"];

const FORMAT_HINTS: Record<Category, string[]> = {
  Letters: [
    "Submit as .docx (Word file).",
    "Bengali text must be typed Unicode — not a scan or image of text.",
    "One submission per issue.",
  ],
  Photography: [
    "JPEG or PNG. Minimum 1500px on the longest side.",
    "sRGB colour space. No RAW or HEIC files.",
    "Submit up to 3 photos. We select one for publication.",
    "One submission per issue.",
  ],
  Art: [
    "JPEG or PNG. Minimum 1500px on the longest side.",
    "RGB colour mode — not CMYK.",
    "Submit up to 3 works. We select one for publication.",
    "One submission per issue.",
  ],
  Comics: [
    "Single-panel: one JPEG or PNG.",
    "Multi-panel: one image file per panel, numbered in order. All panels must share the same aspect ratio.",
    "Minimum 1200px wide per panel.",
    "One submission per issue.",
  ],
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function TagPicker({ label, options, value, onChange }: {
  label: string; options: string[]; value: string; onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="font-body text-xs text-charcoal/50 uppercase tracking-widest">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button key={opt} type="button" onClick={() => onChange(value === opt ? "" : opt)}
            className={`px-3 py-1 rounded-full text-xs font-body border transition-colors ${
              value === opt ? "bg-terracotta text-paper border-terracotta" : "bg-transparent text-charcoal/60 border-charcoal/20 hover:border-terracotta/40"
            }`}>
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function FileButton({ label, accept, hint, multiple, onChange, files, required }: {
  label: string; accept: string; hint?: string; multiple?: boolean;
  onChange: (files: File[]) => void; files: File[]; required?: boolean;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <label className="font-body text-xs text-charcoal/50 uppercase tracking-widest">
        {label}{required && <span className="text-sindoor ml-0.5">*</span>}
      </label>
      {hint && <p className="font-body text-[11px] text-charcoal/40">{hint}</p>}
      <button type="button" onClick={() => ref.current?.click()}
        className="w-full border border-dashed border-charcoal/25 rounded-lg py-3 px-4 text-sm font-body text-charcoal/50 hover:border-charcoal/40 hover:text-charcoal/70 transition-colors text-left">
        {files.length > 0 ? files.map((f) => f.name).join(", ") : "Tap to choose file"}
      </button>
      <input ref={ref} type="file" accept={accept} multiple={multiple} className="hidden"
        onChange={(e) => onChange(Array.from(e.target.files ?? []))} />
    </div>
  );
}

function TextField({ label, value, onChange, placeholder, multiline, required }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; multiline?: boolean; required?: boolean;
}) {
  const base = "w-full bg-transparent border-b border-charcoal/20 py-2 text-sm font-body text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-charcoal/50 transition-colors";
  return (
    <div className="space-y-1.5">
      <label className="font-body text-xs text-charcoal/50 uppercase tracking-widest">
        {label}{required && <span className="text-sindoor ml-0.5">*</span>}
      </label>
      {multiline
        ? <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={3} className={`${base} resize-none`} />
        : <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={base} />
      }
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main panel                                                         */
/* ------------------------------------------------------------------ */

export default function SubmitPanel() {
  const { user, promptSignIn } = useAuthContext();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [category, setCategory] = useState<Category>("Letters");
  const [title, setTitle] = useState("");
  const [lang, setLang] = useState<"en" | "bn" | "bil">("en");
  const [flavor, setFlavor] = useState("");
  const [customFlavor, setCustomFlavor] = useState("");
  const [type, setType] = useState("");
  const [manuscript, setManuscript] = useState<File[]>([]);
  const [cover, setCover] = useState<File[]>([]);
  const [photos, setPhotos] = useState<PhotoEntry[]>([
    { file: null, caption: "", title: "", medium: "", panels: [] },
  ]);
  const [comicType, setComicType] = useState<ComicType>("single");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const author = user?.displayName ?? "";

  const photoLimit = category === "Comics" ? 1 : 3;

  const isFormValid = (() => {
    if (category === "Letters") return title.trim() !== "" && manuscript.length > 0;
    if (category === "Comics") {
      if (!title.trim()) return false;
      const first = photos[0];
      if (!first?.file || !first.caption.trim()) return false;
      if (comicType === "multi") return first.panels.length > 0;
      return true;
    }
    // Photography / Art: each photo needs a title and caption
    const hasPhotos = photos.some((p) => p.file !== null);
    const allComplete = photos.every((p) => !p.file || (p.title.trim() !== "" && p.caption.trim() !== ""));
    return hasPhotos && allComplete;
  })();

  function updatePhoto(index: number, patch: Partial<PhotoEntry>) {
    setPhotos((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function addPhoto() {
    if (photos.length >= photoLimit) return;
    setPhotos((prev) => [...prev, { file: null, caption: "", title: "", medium: "", panels: [] }]);
  }

  function removePhoto(index: number) {
    setPhotos((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) { promptSignIn(); return; }
    setStatus("submitting");
    setErrorMsg("");

    let idToken: string;
    try {
      idToken = await user.getIdToken();
    } catch {
      setStatus("error");
      setErrorMsg("Authentication error. Please sign in again.");
      return;
    }

    const fd = new FormData();
    fd.append("idToken", idToken);
    fd.append("category", category);
    if (title) fd.append("title", title);
    fd.append("author", author);
    fd.append("lang", lang);
    const effectiveFlavor = customFlavor.trim() || flavor;
    if (effectiveFlavor) fd.append("flavor", effectiveFlavor);
    if (type) fd.append("type", type);

    if (category === "Letters") {
      if (manuscript[0]) fd.append("manuscript", manuscript[0]);
      if (cover[0]) {
        const [compressed] = await compressFiles([cover[0]]);
        fd.append("cover", compressed);
      }
    } else {
      for (let i = 0; i < photos.length; i++) {
        const p = photos[i];
        if (p.file) {
          const [compressed] = await compressFiles([p.file]);
          fd.append(`photo_${i}_file`, compressed);
        }
        fd.append(`photo_${i}_caption`, p.caption);
        fd.append(`photo_${i}_title`, p.title);
        if (p.medium) fd.append(`photo_${i}_medium`, p.medium);
        if (category === "Comics" && comicType === "multi") {
          const compressedPanels = await compressFiles(p.panels);
          compressedPanels.forEach((panel, pi) => fd.append(`photo_${i}_panel_${pi}`, panel));
        }
      }
    }

    try {
      const res = await fetch("/api/submit", { method: "POST", body: fd });
      if (res.status === 413) throw new Error("File too large. Please use smaller images.");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Submission failed.");
      setStatus("success");
    } catch (err) {
      setStatus("error");
      setErrorMsg(err instanceof Error ? err.message : "Something went wrong.");
    }
  }

  if (!mounted) return <div className="h-full bg-paper" />;

  /* ---- Success state ---- */
  if (status === "success") {
    return (
      <div className="h-full bg-paper flex flex-col items-center justify-center px-8 text-center">
        <KanthaDivider className="max-w-[160px] mx-auto mb-6" />
        <h2 className="heading-display text-3xl text-charcoal mb-3">Thank You</h2>
        <p className="font-body text-sm text-charcoal/60 max-w-xs">
          We have received your submission and will be in touch.
        </p>
        <p className="font-body text-xs text-charcoal/35 mt-6 tracking-wide">probashferrymagazine@gmail.com</p>
      </div>
    );
  }

  /* ---- Auth gate ---- */
  if (!user) {
    return (
      <div className="h-full bg-paper flex flex-col items-center justify-center px-8 text-center">
        <KanthaDivider className="max-w-[160px] mx-auto mb-6" />
        <p className="font-body text-xs text-charcoal/40 uppercase tracking-widest mb-4">Submit Your Work</p>
        <h2 className="heading-display text-3xl text-charcoal mb-3">Sign In to Continue</h2>
        <p className="font-body text-sm text-charcoal/60 max-w-xs mb-8">
          We ask you to sign in so we can reach you about your submission.
        </p>
        <button onClick={promptSignIn}
          className="px-6 py-3 bg-terracotta text-paper font-body text-sm rounded-full hover:bg-terracotta/80 transition-colors">
          Sign in with Google
        </button>
      </div>
    );
  }

  /* ---- Form ---- */
  return (
    <div className="h-full bg-paper overflow-y-auto">
      <div className="max-w-lg mx-auto px-6 pt-4 pb-10 space-y-8">

        {/* Header */}
        <div className="text-center mb-2 pt-10">
          <h2 className="heading-display text-2xl sm:text-3xl lg:text-4xl text-charcoal">Submit Your Work</h2>
          <KanthaDivider className="max-w-[200px] mx-auto" />
        </div>

        <form onSubmit={handleSubmit} noValidate className="space-y-8">

          {/* Category selector */}
          <div className="space-y-2">
            <label className="font-body text-xs text-charcoal/50 uppercase tracking-widest">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button key={cat} type="button" onClick={() => setCategory(cat)}
                  className={`py-2.5 rounded-lg text-sm font-body border transition-colors ${
                    category === cat ? "bg-terracotta text-paper border-terracotta" : "bg-transparent text-charcoal/60 border-charcoal/20 hover:border-terracotta/40 hover:text-terracotta"
                  }`}>
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Format guidance */}
          <div className="border-l-2 border-mustard bg-mustard/5 rounded-r-lg px-4 py-3 space-y-1">
            <p className="font-body text-[10px] text-terracotta uppercase tracking-widest mb-2">Format guidelines</p>
            {FORMAT_HINTS[category].map((hint, i) => (
              <p key={i} className="font-body text-xs text-charcoal/60 leading-relaxed">
                {hint}
              </p>
            ))}
          </div>

          {/* Common fields */}
          <div className="space-y-5">
            {(category === "Letters" || category === "Comics") && (
              <TextField label="Title" value={title} onChange={setTitle} placeholder="Your title" required />
            )}
            <div className="font-body text-xs text-charcoal/50">
              Submitting as <span className="text-charcoal font-medium">{author}</span>
            </div>
          </div>

          {/* Letters */}
          {category === "Letters" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="font-body text-xs text-charcoal/50 uppercase tracking-widest">Language</label>
                <div className="flex gap-3 flex-wrap">
                  {(["en", "bn", "bil"] as const).map((l) => (
                    <button key={l} type="button" onClick={() => setLang(l)}
                      className={`px-4 py-1.5 rounded-full text-xs font-body border transition-colors ${
                        lang === l ? "bg-terracotta text-paper border-terracotta" : "bg-transparent text-charcoal/60 border-charcoal/20 hover:border-terracotta/40"
                      }`}>
                      {l === "en" ? "English" : l === "bn" ? "বাংলা" : "Bilingual"}
                    </button>
                  ))}
                </div>
              </div>
              <TagPicker label="Type" options={TYPE_TAGS} value={type} onChange={setType} />
              <div className="space-y-2">
                <TagPicker label="Flavor" options={FLAVOR_TAGS}
                  value={customFlavor ? "" : flavor}
                  onChange={(v) => { setFlavor(v); setCustomFlavor(""); }} />
                <input type="text" value={customFlavor}
                  onChange={(e) => { const v = e.target.value.replace(/\s/g, ""); setCustomFlavor(v); if (v) setFlavor(""); }}
                  placeholder="Or type your own (one word)"
                  className="w-full bg-transparent border-b border-charcoal/20 py-1.5 text-sm font-body text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-charcoal/50 transition-colors" />
              </div>
              <FileButton label="Manuscript" accept=".docx" required
                hint=".docx (Word file). Accept all tracked changes before submitting."
                files={manuscript} onChange={setManuscript} />
              <FileButton label="Cover Image (optional)" accept="image/jpeg,image/png"
                hint="JPEG or PNG. We may source our own if not provided."
                files={cover} onChange={setCover} />
            </div>
          )}

          {/* Photography / Art */}
          {(category === "Photography" || category === "Art") && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="font-body text-xs text-charcoal/50 uppercase tracking-widest">
                  {category === "Photography" ? "Photos" : "Works"}<span className="text-sindoor ml-0.5">*</span>
                </label>
                <span className="font-body text-[11px] text-charcoal/35">{photos.length} / {photoLimit}</span>
              </div>

              {photos.map((photo, i) => (
                <div key={i} className="border border-mustard/30 rounded-lg p-4 space-y-4 bg-mustard/[0.02]">
                  <div className="flex items-center justify-between">
                    <span className="font-body text-xs text-charcoal/40">
                      {category === "Photography" ? `Photo ${i + 1}` : `Work ${i + 1}`}
                    </span>
                    {photos.length > 1 && (
                      <button type="button" onClick={() => removePhoto(i)}
                        className="font-body text-xs text-charcoal/30 hover:text-sindoor transition-colors">
                        Remove
                      </button>
                    )}
                  </div>
                  <FileButton label="Image" accept="image/jpeg,image/png" required={i === 0}
                    hint={category === "Photography" ? "JPEG or PNG. Min 1500px on longest side. sRGB." : "JPEG or PNG. Min 1500px. RGB colour mode."}
                    files={photo.file ? [photo.file] : []} onChange={(files) => updatePhoto(i, { file: files[0] ?? null })} />
                  <TextField label="Caption" value={photo.caption} onChange={(v) => updatePhoto(i, { caption: v })}
                    placeholder="Caption for this image" required />
                  <TextField label="Title" value={photo.title} onChange={(v) => updatePhoto(i, { title: v })}
                    placeholder="Title of this work" required />
                  {category === "Art" && (
                    <TextField label="Medium" value={photo.medium} onChange={(v) => updatePhoto(i, { medium: v })}
                      placeholder="e.g. Oil on canvas, Digital illustration" />
                  )}
                </div>
              ))}

              {photos.length < photoLimit && (
                <button type="button" onClick={addPhoto}
                  className="w-full py-2 font-body text-sm text-charcoal/40 hover:text-charcoal/60 border border-dashed border-charcoal/15 rounded-lg transition-colors">
                  + Add another (max {photoLimit})
                </button>
              )}
            </div>
          )}

          {/* Comics */}
          {category === "Comics" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="font-body text-xs text-charcoal/50 uppercase tracking-widest">Type</label>
                <div className="flex gap-3">
                  {(["single", "multi"] as ComicType[]).map((t) => (
                    <button key={t} type="button" onClick={() => setComicType(t)}
                      className={`px-4 py-1.5 rounded-full text-xs font-body border transition-colors ${
                        comicType === t ? "bg-terracotta text-paper border-terracotta" : "bg-transparent text-charcoal/60 border-charcoal/20 hover:border-terracotta/40"
                      }`}>
                      {t === "single" ? "Single panel" : "Multi-panel"}
                    </button>
                  ))}
                </div>
              </div>

              {comicType === "single" ? (
                <FileButton label="Panel image" accept="image/jpeg,image/png" required
                  hint="JPEG or PNG. Min 1200px wide."
                  files={photos[0].file ? [photos[0].file] : []}
                  onChange={(files) => updatePhoto(0, { file: files[0] ?? null })} />
              ) : (
                <div className="space-y-4">
                  <FileButton label="Panel files" accept="image/jpeg,image/png" multiple required
                    hint="One file per panel, in order. All panels must share the same aspect ratio. Min 1200px wide."
                    files={photos[0].panels}
                    onChange={(files) => updatePhoto(0, { file: files[0] ?? null, panels: files })} />
                </div>
              )}

              <TextField label="Caption" value={photos[0].caption}
                onChange={(v) => updatePhoto(0, { caption: v })} placeholder="e.g. Episode 1: The Beginning" required />
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <p className="font-body text-sm text-sindoor">{errorMsg}</p>
          )}

          {/* Submit */}
          <button type="submit" disabled={!isFormValid || status === "submitting"}
            className="w-full py-3.5 bg-terracotta text-paper font-body text-sm rounded-full hover:bg-terracotta/80 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {status === "submitting" ? "Sending..." : "Submit"}
          </button>

          <p className="font-body text-[10px] text-charcoal/30 text-center pb-4">
            Submissions are final and cannot be edited after sending. We review everything and will be in touch either way.
          </p>

        </form>
      </div>
    </div>
  );
}
