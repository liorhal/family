"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";

interface AdminSectionProps {
  title: string;
  description?: string;
  createButtonLabel: string;
  onCreateClick: () => void;
  children: React.ReactNode;
}

export function AdminSection({
  title,
  description,
  createButtonLabel,
  onCreateClick,
  children,
}: AdminSectionProps) {
  const [collapsed, setCollapsed] = useState(true);

  function handleCreateClick() {
    setCollapsed(false);
    onCreateClick();
  }

  return (
    <Card>
      <CardHeader className="cursor-pointer select-none" onClick={() => setCollapsed((c) => !c)}>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-2">
            {collapsed ? (
              <ChevronRight className="h-5 w-5 shrink-0 text-slate-400" />
            ) : (
              <ChevronDown className="h-5 w-5 shrink-0 text-slate-400" />
            )}
            <div>
              <CardTitle>{title}</CardTitle>
              {description && (
                <p className="mt-0.5 text-sm text-slate-500">{description}</p>
              )}
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleCreateClick();
            }}
            className="shrink-0"
          >
            <Plus className="mr-1.5 h-4 w-4" />
            {createButtonLabel}
          </Button>
        </div>
      </CardHeader>
      {!collapsed && <CardContent className="space-y-6">{children}</CardContent>}
    </Card>
  );
}
