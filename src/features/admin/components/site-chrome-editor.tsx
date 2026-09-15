"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { updateSiteChromeAction } from "@/actions/site-chrome";
import type { SiteChrome } from "@/config/site-chrome-defaults";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function newLink() {
  return { label: "New link", href: "/", kind: "link" as const };
}

export function SiteChromeEditor({
  organizationId,
  initialChrome,
}: {
  organizationId: string;
  initialChrome: SiteChrome;
}) {
  const [chrome, setChrome] = useState(initialChrome);
  const [loading, setLoading] = useState(false);

  async function save() {
    setLoading(true);
    try {
      const result = await updateSiteChromeAction({ organizationId, chrome });
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      toast.success("Menus and footer saved — live on the public site");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button disabled={loading} onClick={() => void save()}>
          {loading ? "Saving…" : "Save site chrome"}
        </Button>
      </div>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">Header menu</CardTitle>
          <CardDescription>
            These links appear in the public header. Use Lead button for
            enquire/list popups.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Header button label</Label>
              <Input
                value={chrome.headerCtaLabel}
                onChange={(e) =>
                  setChrome((c) => ({ ...c, headerCtaLabel: e.target.value }))
                }
              />
            </div>
          </div>
          {chrome.nav.map((item, index) => (
            <div
              key={index}
              className="grid gap-2 rounded-lg border border-dashed p-3 sm:grid-cols-[1fr_1fr_140px_auto]"
            >
              <Input
                value={item.label}
                placeholder="Label"
                onChange={(e) => {
                  const nav = [...chrome.nav];
                  nav[index] = { ...item, label: e.target.value };
                  setChrome((c) => ({ ...c, nav }));
                }}
              />
              <Input
                value={item.href}
                placeholder="/properties"
                onChange={(e) => {
                  const nav = [...chrome.nav];
                  nav[index] = { ...item, href: e.target.value };
                  setChrome((c) => ({ ...c, nav }));
                }}
              />
              <select
                className="h-9 rounded-md border bg-background px-2 text-sm"
                value={item.kind ?? "link"}
                onChange={(e) => {
                  const nav = [...chrome.nav];
                  nav[index] = {
                    ...item,
                    kind: e.target.value as "link" | "lead",
                  };
                  setChrome((c) => ({ ...c, nav }));
                }}
              >
                <option value="link">Page link</option>
                <option value="lead">Lead button</option>
              </select>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="text-destructive"
                onClick={() =>
                  setChrome((c) => ({
                    ...c,
                    nav: c.nav.filter((_, i) => i !== index),
                  }))
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setChrome((c) => ({ ...c, nav: [...c.nav, newLink()] }))
            }
          >
            <Plus className="mr-1 size-3.5" />
            Add menu item
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">Footer</CardTitle>
          <CardDescription>
            Tagline, link columns, and social profiles. Phone/email/address
            come from Admin → Settings.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Footer tagline</Label>
            <Textarea
              rows={3}
              value={chrome.footerTagline}
              onChange={(e) =>
                setChrome((c) => ({ ...c, footerTagline: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input
                value={chrome.social.instagram}
                onChange={(e) =>
                  setChrome((c) => ({
                    ...c,
                    social: { ...c.social, instagram: e.target.value },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>LinkedIn</Label>
              <Input
                value={chrome.social.linkedin}
                onChange={(e) =>
                  setChrome((c) => ({
                    ...c,
                    social: { ...c.social, linkedin: e.target.value },
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Facebook</Label>
              <Input
                value={chrome.social.facebook}
                onChange={(e) =>
                  setChrome((c) => ({
                    ...c,
                    social: { ...c.social, facebook: e.target.value },
                  }))
                }
              />
            </div>
          </div>
          {chrome.footerColumns.map((column, columnIndex) => (
            <div
              key={columnIndex}
              className="space-y-3 rounded-xl border p-4"
            >
              <div className="flex items-center gap-2">
                <Input
                  value={column.title}
                  onChange={(e) => {
                    const footerColumns = [...chrome.footerColumns];
                    footerColumns[columnIndex] = {
                      ...column,
                      title: e.target.value,
                    };
                    setChrome((c) => ({ ...c, footerColumns }));
                  }}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  onClick={() =>
                    setChrome((c) => ({
                      ...c,
                      footerColumns: c.footerColumns.filter(
                        (_, i) => i !== columnIndex,
                      ),
                    }))
                  }
                >
                  Remove column
                </Button>
              </div>
              {column.links.map((link, linkIndex) => (
                <div
                  key={linkIndex}
                  className="grid gap-2 sm:grid-cols-[1fr_1fr_140px_auto]"
                >
                  <Input
                    value={link.label}
                    onChange={(e) => {
                      const footerColumns = [...chrome.footerColumns];
                      const links = [...column.links];
                      links[linkIndex] = { ...link, label: e.target.value };
                      footerColumns[columnIndex] = { ...column, links };
                      setChrome((c) => ({ ...c, footerColumns }));
                    }}
                  />
                  <Input
                    value={link.href}
                    onChange={(e) => {
                      const footerColumns = [...chrome.footerColumns];
                      const links = [...column.links];
                      links[linkIndex] = { ...link, href: e.target.value };
                      footerColumns[columnIndex] = { ...column, links };
                      setChrome((c) => ({ ...c, footerColumns }));
                    }}
                  />
                  <select
                    className="h-9 rounded-md border bg-background px-2 text-sm"
                    value={link.kind ?? "link"}
                    onChange={(e) => {
                      const footerColumns = [...chrome.footerColumns];
                      const links = [...column.links];
                      links[linkIndex] = {
                        ...link,
                        kind: e.target.value as "link" | "lead",
                      };
                      footerColumns[columnIndex] = { ...column, links };
                      setChrome((c) => ({ ...c, footerColumns }));
                    }}
                  >
                    <option value="link">Page link</option>
                    <option value="lead">Lead button</option>
                  </select>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const footerColumns = [...chrome.footerColumns];
                      footerColumns[columnIndex] = {
                        ...column,
                        links: column.links.filter((_, i) => i !== linkIndex),
                      };
                      setChrome((c) => ({ ...c, footerColumns }));
                    }}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const footerColumns = [...chrome.footerColumns];
                  footerColumns[columnIndex] = {
                    ...column,
                    links: [...column.links, newLink()],
                  };
                  setChrome((c) => ({ ...c, footerColumns }));
                }}
              >
                Add link
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setChrome((c) => ({
                ...c,
                footerColumns: [
                  ...c.footerColumns,
                  { title: "New column", links: [newLink()] },
                ],
              }))
            }
          >
            Add footer column
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">
            Opening hours
          </CardTitle>
          <CardDescription>Shown on the contact page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>Timezone label</Label>
            <Input
              value={chrome.timezoneLabel}
              onChange={(e) =>
                setChrome((c) => ({ ...c, timezoneLabel: e.target.value }))
              }
            />
          </div>
          {chrome.hours.map((slot, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input
                value={slot.days}
                onChange={(e) => {
                  const hours = [...chrome.hours];
                  hours[index] = { ...slot, days: e.target.value };
                  setChrome((c) => ({ ...c, hours }));
                }}
              />
              <Input
                value={slot.time}
                onChange={(e) => {
                  const hours = [...chrome.hours];
                  hours[index] = { ...slot, time: e.target.value };
                  setChrome((c) => ({ ...c, hours }));
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  setChrome((c) => ({
                    ...c,
                    hours: c.hours.filter((_, i) => i !== index),
                  }))
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setChrome((c) => ({
                ...c,
                hours: [...c.hours, { days: "New day", time: "—" }],
              }))
            }
          >
            Add hours row
          </Button>
        </CardContent>
      </Card>

      <Card className="border-border/80">
        <CardHeader>
          <CardTitle className="font-display text-xl">Redirects</CardTitle>
          <CardDescription>
            Send an unused URL to another page. Reserved routes such as /about
            keep their own pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {chrome.redirects.map((item, index) => (
            <div key={index} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input
                value={item.from}
                placeholder="/old-url"
                onChange={(e) => {
                  const redirects = [...chrome.redirects];
                  redirects[index] = { ...item, from: e.target.value };
                  setChrome((c) => ({ ...c, redirects }));
                }}
              />
              <Input
                value={item.to}
                placeholder="/properties"
                onChange={(e) => {
                  const redirects = [...chrome.redirects];
                  redirects[index] = { ...item, to: e.target.value };
                  setChrome((c) => ({ ...c, redirects }));
                }}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() =>
                  setChrome((c) => ({
                    ...c,
                    redirects: c.redirects.filter((_, i) => i !== index),
                  }))
                }
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setChrome((c) => ({
                ...c,
                redirects: [...c.redirects, { from: "/", to: "/" }],
              }))
            }
          >
            Add redirect
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
