"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Organization } from "@quizarena/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Save, Palette, Upload } from "lucide-react";

const FONT_OPTIONS = [
  "Inter",
  "Poppins",
  "Montserrat",
  "Roboto",
  "Open Sans",
  "Lato",
  "Nunito",
  "Raleway",
];

const COLOR_PRESETS = [
  { primary: "#EEDC00", secondary: "#f5e500", name: "ENS Future Gold" },
  { primary: "#d4c500", secondary: "#EEDC00", name: "Executive Gold" },
  { primary: "#1F2A44", secondary: "#EEDC00", name: "Midnight Gold" },
  { primary: "#184E45", secondary: "#D8C27A", name: "Emerald Brass" },
  { primary: "#4C2A3D", secondary: "#D4A85F", name: "Aubergine Copper" },
  { primary: "#2A2A2E", secondary: "#8F9399", name: "Carbon Slate" },
];

const COLOR_CLASS_MAP: Record<string, string> = {
  "#EEDC00": "bg-[#EEDC00]",
  "#f5e500": "bg-[#f5e500]",
  "#d4c500": "bg-[#d4c500]",
  "#D5B35B": "bg-[#D5B35B]",
  "#1F2A44": "bg-[#1F2A44]",
  "#184E45": "bg-[#184E45]",
  "#D8C27A": "bg-[#D8C27A]",
  "#4C2A3D": "bg-[#4C2A3D]",
  "#D4A85F": "bg-[#D4A85F]",
  "#2A2A2E": "bg-[#2A2A2E]",
  "#8F9399": "bg-[#8F9399]",
};

export default function BrandingPage() {
  const supabase = createClient();
  const [org, setOrg] = useState<Organization | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const livePreviewSvg = useMemo(() => {
    if (!org) return "";

    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 220" role="img" aria-label="Brand preview">
        <defs>
          <linearGradient id="brandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="${org.primary_color || "#EEDC00"}" />
            <stop offset="100%" stop-color="${org.secondary_color || "#f5e500"}" />
          </linearGradient>
        </defs>
        <rect width="720" height="220" rx="28" fill="url(#brandGradient)" />
        <rect x="18" y="18" width="684" height="184" rx="22" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.18)" />
        <text x="360" y="102" text-anchor="middle" fill="#111111" font-size="30" font-family="Inter, Arial, sans-serif" font-weight="700">
          ${org.name || "QuizArena"} — Live Preview
        </text>
        <text x="360" y="142" text-anchor="middle" fill="rgba(17,17,17,0.72)" font-size="16" font-family="Inter, Arial, sans-serif">
          ${(org.primary_color || "#EEDC00")} / ${(org.secondary_color || "#f5e500")}
        </text>
      </svg>
    `;

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
  }, [org]);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("organization")
        .select("*")
        .single();
      if (data) setOrg(data as Organization);
    }
    load();
  }, []);

  if (!org) return <div className="page-container relative z-10">Loading...</div>;

  async function handleSave() {
    if (!org) return;
    setSaving(true);
    setSaved(false);

    const { error } = await supabase
      .from("organization")
      .update({
        name: org.name,
        tagline: org.tagline,
        logo_url: org.logo_url,
        primary_color: org.primary_color,
        secondary_color: org.secondary_color,
        font_family: org.font_family,
      })
      .eq("id", org.id);

    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
  }

  async function handleLogoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop();
    const path = `logos/${org!.id}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("media")
      .upload(path, file, { upsert: true });

    if (uploadErr) return;

    const { data: urlData } = supabase.storage
      .from("media")
      .getPublicUrl(path);

    setOrg((prev) =>
      prev ? { ...prev, logo_url: urlData.publicUrl } : prev
    );
  }

  return (
    <div className="page-container max-w-2xl relative z-10">
      <div className="mb-8 rounded-2xl glass p-6 border border-[#EEDC00]/20 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 accent-bar" />
        <h1 className="text-3xl font-serif font-black text-foreground dark:text-white">Company Branding</h1>
        <p className="text-muted-foreground mt-1">
          Customize how your brand appears to players
        </p>
      </div>

      <div className="space-y-6">
        {/* Identity */}
        <Card className="glass border-white/15">
          <CardHeader>
            <CardTitle>Brand Identity</CardTitle>
            <CardDescription>
              Name and logo shown in the player app and host lobby
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Company Name</Label>
              <Input
                value={org.name}
                onChange={(e) => setOrg({ ...org, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input
                value={org.tagline || ""}
                onChange={(e) =>
                  setOrg({ ...org, tagline: e.target.value })
                }
                placeholder="Your company tagline"
              />
            </div>
            <div className="space-y-2">
              <Label>Logo</Label>
              <div className="flex items-center gap-4">
                {org.logo_url && (
                  <img
                    src={org.logo_url}
                    alt="Logo"
                    className="w-16 h-16 rounded-lg object-contain bg-white/5 p-2"
                  />
                )}
                <div>
                  <Label
                    htmlFor="logo-upload"
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border border-[#EEDC00]/30 rounded-md bg-[#EEDC00]/10 text-[#EEDC00] hover:bg-[#EEDC00]/20 transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Logo
                  </Label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    title="Upload company logo"
                    aria-label="Upload company logo"
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card className="glass border-white/15">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-5 h-5" />
              Colors
            </CardTitle>
            <CardDescription>
              Choose a polished, high-contrast palette for hosts and players
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Presets */}
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.name}
                  onClick={() =>
                    setOrg({
                      ...org,
                      primary_color: preset.primary,
                      secondary_color: preset.secondary,
                    })
                  }
                  className="flex flex-col items-center p-2 rounded-lg border border-white/10 bg-white/5 hover:border-[#EEDC00]/40 hover:bg-[#EEDC00]/10 transition-colors"
                  title={preset.name}
                >
                  <div className="flex gap-1">
                    <div className={`w-6 h-6 rounded-full ${COLOR_CLASS_MAP[preset.primary] || "bg-muted"}`} />
                    <div className={`w-6 h-6 rounded-full ${COLOR_CLASS_MAP[preset.secondary] || "bg-muted"}`} />
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {preset.name}
                  </span>
                </button>
              ))}
            </div>

            {/* Custom color pickers */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary-color-picker">Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="primary-color-picker"
                    type="color"
                    value={org.primary_color}
                    onChange={(e) =>
                      setOrg({ ...org, primary_color: e.target.value })
                    }
                    title="Pick primary color"
                    className="w-10 h-10 rounded border-0 cursor-pointer"
                  />
                  <Input
                    value={org.primary_color}
                    onChange={(e) =>
                      setOrg({ ...org, primary_color: e.target.value })
                    }
                    className="font-mono"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="secondary-color-picker">Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="secondary-color-picker"
                    type="color"
                    value={org.secondary_color}
                    onChange={(e) =>
                      setOrg({ ...org, secondary_color: e.target.value })
                    }
                    title="Pick secondary color"
                    className="w-10 h-10 rounded border-0 cursor-pointer"
                  />
                  <Input
                    value={org.secondary_color}
                    onChange={(e) =>
                      setOrg({ ...org, secondary_color: e.target.value })
                    }
                    className="font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Live preview */}
            <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-white/5">
              <img
                src={livePreviewSvg}
                alt="Brand preview"
                className="block w-full h-auto"
              />
            </div>
          </CardContent>
        </Card>

        {/* Font */}
        <Card className="glass border-white/15">
          <CardHeader>
            <CardTitle>Typography</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Font Family</Label>
              <Select
                value={org.font_family}
                onValueChange={(v) =>
                  setOrg({ ...org, font_family: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem key={font} value={font}>
                      <span>{font}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex items-center gap-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="gradient-primary border-0 btn-3d text-black font-semibold"
            size="lg"
          >
            <Save className="w-4 h-4 mr-2" />
            {saving ? "Saving..." : "Save Branding"}
          </Button>
          {saved && (
            <span className="text-sm text-green-400">
              ✓ Branding saved successfully
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
