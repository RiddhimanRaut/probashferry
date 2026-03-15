"use client";

import { useState, useRef, useEffect } from "react";
import KanthaDivider from "@/components/ui/KanthaDivider";
import { useAuthContext } from "@/providers/AuthProvider";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Category = "Essays" | "Photography" | "Art" | "Comics";

interface PhotoEntry {
  file: File | null;
  caption: string;
  title: string;
  medium: string;
  panels: File[];
}

const CATEGORIES: Category[] = ["Essays", "Photography", "Art", "Comics"];

const FLAVOR_TAGS = ["Culture", "Faith", "Travel", "Food", "Identity", "Memory", "Belonging"];
const TYPE_TAGS = ["Prose", "Poem", "Memoir", "Essay", "Fiction"];

const CATEGORY_HINT: Record<Category, string> = {
  Essays: "JPEG or PNG, optional",
  Photography: "JPEG only, shown as the series hero",
  Art: "JPEG or PNG, shown as the series hero",
  Comics: "JPEG or PNG, shown as the series hero",
};

/* ------------------------------------------------------------------ */
/*  Sub-components                                                     */
/* ------------------------------------------------------------------ */

function TagPicker({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <label className="font-body text-xs text-charcoal/50 uppercase tracking-widest">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            type="button"
            onClick={() => onChange(value === opt ? "" : opt)}
            className={`px-3 py-1 rounded-full text-xs font-body border transition-colors ${
              value === opt
                ? "bg-charcoal text-paper border-charcoal"
                : "bg-transparent text-charcoal/60 border-charcoal/20 hover:border-charcoal/40"
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
    </div>
  );
}

function FileButton({
  label,
  accept,
  hint,
  multiple,
  onChange,
  files,
}: {
  label: string;
  accept: string;
  hint?: string;
  multiple?: boolean;
  onChange: (files: File[]) => void;
  files: File[];
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <div className="space-y-1.5">
      <label className="font-body text-xs text-charcoal/50 uppercase tracking-widest">{label}</label>
      {hint && <p className="font-body text-[11px] text-charcoal/40">{hint}</p>}
      <button
        type="button"
        onClick={() => ref.current?.click()}
        className="w-full border border-dashed border-charcoal/25 rounded-lg py-3 px-4 text-sm font-body text-charcoal/50 hover:border-charcoal/40 hover:text-charcoal/70 transition-colors text-left"
      >
        {files.length > 0
          ? files.map((f) => f.name).join(", ")
          : "Tap to choose file"}
      </button>
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => onChange(Array.from(e.target.files ?? []))}
      />
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  placeholder,
  multiline,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  required?: boolean;
}) {
  const base =
    "w-full bg-transparent border-b border-charcoal/20 py-2 text-sm font-body text-charcoal placeholder:text-charcoal/30 focus:outline-none focus:border-charcoal/50 transition-colors";
  return (
    <div className="space-y-1.5">
      <label className="font-body text-xs text-charcoal/50 uppercase tracking-widest">
        {label}
        {required && <span className="text-sindoor ml-0.5">*</span>}
      </label>
      {multiline ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className={`${base} resize-none`}
        />
      ) : (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={base}
        />
      )}
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

  const [category, setCategory] = useState<Category>("Essays");
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [lang, setLang] = useState<"en" | "bn">("en");
  const [flavor, setFlavor] = useState("");
  const [type, setType] = useState("");
  const [manuscript, setManuscript] = useState<File[]>([]);
  const [cover, setCover] = useState<File[]>([]);
  const [photos, setPhotos] = useState<PhotoEntry[]>([
    { file: null, caption: "", title: "", medium: "", panels: [] },
  ]);
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const author = user?.displayName ?? "";

  function updatePhoto(index: number, patch: Partial<PhotoEntry>) {
    setPhotos((prev) => prev.map((p, i) => (i === index ? { ...p, ...patch } : p)));
  }

  function addPhoto() {
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

    const fd = new FormData();
    fd.append("category", category);
    fd.append("title", title);
    fd.append("author", author);
    fd.append("excerpt", excerpt);
    fd.append("lang", lang);
    if (flavor) fd.append("flavor", flavor);
    if (type) fd.append("type", type);

    if (category === "Essays") {
      if (manuscript[0]) fd.append("manuscript", manuscript[0]);
      if (cover[0]) fd.append("cover", cover[0]);
    } else {
      if (cover[0]) fd.append("cover", cover[0]);
      photos.forEach((p, i) => {
        if (p.file) fd.append(`photo_${i}_file`, p.file);
        fd.append(`photo_${i}_caption`, p.caption);
        fd.append(`photo_${i}_title`, p.title);
        if (p.medium) fd.append(`photo_${i}_medium`, p.medium);
        p.panels.forEach((panel, pi) => fd.append(`photo_${i}_panel_${pi}`, panel));
      });
    }

    try {
      const res = await fetch("/api/submit", { method: "POST", body: fd });
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
        <button
          onClick={promptSignIn}
          className="px-6 py-3 bg-charcoal text-paper font-body text-sm rounded-full hover:bg-charcoal/80 transition-colors"
        >
          Sign in with Google
        </button>
      </div>
    );
  }

  /* ---- Form ---- */
  return (
    <div className="h-full bg-paper overflow-y-auto">
      <div className="max-w-lg mx-auto px-6 py-10 space-y-8">

        {/* Header */}
        <div className="text-center space-y-2">
          <KanthaDivider className="max-w-[160px] mx-auto" />
          <p className="font-body text-[10px] text-charcoal/40 uppercase tracking-widest pt-2">
            প্রবাসফেরি
          </p>
          <h1 className="heading-display text-3xl text-charcoal">Submit Your Work</h1>
          <p className="font-body text-sm text-charcoal/50">
            Essays, photography, art, and comics.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Category selector */}
          <div className="space-y-2">
            <label className="font-body text-xs text-charcoal/50 uppercase tracking-widest">Category</label>
            <div className="grid grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`py-2.5 rounded-lg text-sm font-body border transition-colors ${
                    category === cat
                      ? "bg-charcoal text-paper border-charcoal"
                      : "bg-transparent text-charcoal/60 border-charcoal/20 hover:border-charcoal/40"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Common fields */}
          <div className="space-y-5">
            <TextField label="Title" value={title} onChange={setTitle} placeholder="Your title" required />
            <TextField
              label="Excerpt"
              value={excerpt}
              onChange={setExcerpt}
              placeholder="One sentence — appears in the table of contents"
              multiline
              required
            />
            <div className="font-body text-xs text-charcoal/50">
              Submitting as <span className="text-charcoal font-medium">{author}</span>
            </div>
          </div>

          {/* Essays-specific */}
          {category === "Essays" && (
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="font-body text-xs text-charcoal/50 uppercase tracking-widest">Language</label>
                <div className="flex gap-3">
                  {(["en", "bn"] as const).map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLang(l)}
                      className={`px-4 py-1.5 rounded-full text-xs font-body border transition-colors ${
                        lang === l
                          ? "bg-charcoal text-paper border-charcoal"
                          : "bg-transparent text-charcoal/60 border-charcoal/20 hover:border-charcoal/40"
                      }`}
                    >
                      {l === "en" ? "English" : "বাংলা"}
                    </button>
                  ))}
                </div>
              </div>
              <TagPicker label="Type" options={TYPE_TAGS} value={type} onChange={setType} />
              <TagPicker label="Flavor" options={FLAVOR_TAGS} value={flavor} onChange={setFlavor} />
              <FileButton
                label="Manuscript"
                accept=".docx"
                hint=".docx only. Bengali text must be Unicode typed, not a scan."
                files={manuscript}
                onChange={setManuscript}
              />
              <FileButton
                label="Cover Image (optional)"
                accept="image/jpeg,image/png"
                hint={CATEGORY_HINT[category]}
                files={cover}
                onChange={setCover}
              />
            </div>
          )}

          {/* Photography / Art / Comics */}
          {category !== "Essays" && (
            <div className="space-y-6">
              <FileButton
                label="Cover Image"
                accept="image/jpeg,image/png"
                hint={CATEGORY_HINT[category]}
                files={cover}
                onChange={setCover}
              />

              <div className="space-y-2">
                <label className="font-body text-xs text-charcoal/50 uppercase tracking-widest">
                  {category === "Comics" ? "Strips" : "Photos"}
                </label>

                {photos.map((photo, i) => (
                  <div key={i} className="border border-charcoal/10 rounded-lg p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="font-body text-xs text-charcoal/40">
                        {category === "Comics" ? `Strip ${i + 1}` : `Photo ${i + 1}`}
                      </span>
                      {photos.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removePhoto(i)}
                          className="font-body text-xs text-charcoal/30 hover:text-sindoor transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <FileButton
                      label="Image"
                      accept="image/jpeg,image/png"
                      files={photo.file ? [photo.file] : []}
                      onChange={(files) => updatePhoto(i, { file: files[0] ?? null })}
                    />
                    <TextField
                      label="Caption"
                      value={photo.caption}
                      onChange={(v) => updatePhoto(i, { caption: v })}
                      placeholder="Caption for this image"
                    />
                    <TextField
                      label="Title (optional)"
                      value={photo.title}
                      onChange={(v) => updatePhoto(i, { title: v })}
                      placeholder="Individual title"
                    />
                    {category === "Art" && (
                      <TextField
                        label="Medium"
                        value={photo.medium}
                        onChange={(v) => updatePhoto(i, { medium: v })}
                        placeholder="e.g. Oil on canvas, Digital illustration"
                      />
                    )}
                    {category === "Comics" && (
                      <FileButton
                        label="Panel files (multi-panel comics only)"
                        accept="image/jpeg,image/png"
                        hint="One file per panel, in order. Same aspect ratio throughout."
                        multiple
                        files={photo.panels}
                        onChange={(files) => updatePhoto(i, { panels: files })}
                      />
                    )}
                  </div>
                ))}

                {category !== "Comics" || photos.length < 20 ? (
                  <button
                    type="button"
                    onClick={addPhoto}
                    className="w-full py-2 font-body text-sm text-charcoal/40 hover:text-charcoal/60 border border-dashed border-charcoal/15 rounded-lg transition-colors"
                  >
                    + Add another
                  </button>
                ) : null}
              </div>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <p className="font-body text-sm text-sindoor">{errorMsg}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={status === "submitting"}
            className="w-full py-3.5 bg-charcoal text-paper font-body text-sm rounded-full hover:bg-charcoal/80 disabled:opacity-50 transition-colors"
          >
            {status === "submitting" ? "Sending..." : "Submit"}
          </button>

          <p className="font-body text-[10px] text-charcoal/30 text-center pb-4">
            We review all submissions before publication. You will hear from us either way.
          </p>

        </form>
      </div>
    </div>
  );
}
