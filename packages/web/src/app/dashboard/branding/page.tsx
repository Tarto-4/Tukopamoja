"use client";

import { useState, useEffect } from "react";
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
  { primary: "#8E191E", secondary: "#C9A84C", name: "Executive Crimson" },
  { primary: "#6B1216", secondary: "#D5B35B", name: "Heritage Gold" },
  { primary: "#1F2A44", secondary: "#C9A84C", name: "Midnight Gold" },
  { primary: "#184E45", secondary: "#D8C27A", name: "Emerald Brass" },
  { primary: "#4C2A3D", secondary: "#D4A85F", name: "Aubergine Copper" },
  { primary: "#2A2A2E", secondary: "#8F9399", name: "Carbon Slate" },
];

export default function BrandingPage() {
  const supabase = createClient();
  const [org, setOrg] = useState<Organization | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

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

  if (!org) return <div className="page-container">Loading...</div>;

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
    <div className="page-container max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-black">Company Branding</h1>
        <p className="text-muted-foreground mt-1">
          Customize how your brand appears to players
        </p>
      </div>

      <div className="space-y-6">
        {/* Identity */}
        <Card>
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
                    className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-accent transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Upload Logo
                  </Label>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Colors */}
        <Card>
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
                  className="flex flex-col items-center p-2 rounded-lg border hover:border-primary/50 transition-colors"
                  title={preset.name}
                >
                  <div className="flex gap-1">
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: preset.primary }}
                    />
                    <div
                      className="w-6 h-6 rounded-full"
                      style={{ backgroundColor: preset.secondary }}
                    />
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
                <Label>Primary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={org.primary_color}
                    onChange={(e) =>
                      setOrg({ ...org, primary_color: e.target.value })
                    }
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
                <Label>Secondary Color</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={org.secondary_color}
                    onChange={(e) =>
                      setOrg({ ...org, secondary_color: e.target.value })
                    }
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
            <div
              className="rounded-lg p-6 text-center text-white font-serif font-bold text-xl"
              style={{
                background: `linear-gradient(135deg, ${org.primary_color}, ${org.secondary_color})`,
              }}
            >
              {org.name} — Live Preview
            </div>
          </CardContent>
        </Card>

        {/* Font */}
        <Card>
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
                      <span style={{ fontFamily: font }}>{font}</span>
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
            className="gradient-primary border-0 btn-3d text-white font-semibold"
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
