'use client';

import React from 'react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { ChevronDown, FileText, Newspaper, Cpu, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectionActionsMenuProps {
  selectedCount: number;
  onQuickSummary: () => void;
  onGenerateNewsletter: () => void;
  onBulkProcess: () => void;
  onExportSelected: () => void;
}

export function SelectionActionsMenu({
  selectedCount,
  onQuickSummary,
  onGenerateNewsletter,
  onBulkProcess,
  onExportSelected,
}: SelectionActionsMenuProps) {
  if (selectedCount === 0) return null;

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-accent bg-accent/10 border border-accent/20 rounded-md hover:bg-accent/15 transition-colors">
          {selectedCount} selected
          <ChevronDown className="w-3 h-3" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={4}
          className="w-52 bg-card border border-border rounded-lg shadow-lg z-50 py-1"
        >
          <DropdownMenu.Item
            onSelect={onQuickSummary}
            className="flex items-center gap-2 px-3 py-2 text-xs text-foreground cursor-pointer hover:bg-muted transition-colors outline-none"
          >
            <FileText className="w-3.5 h-3.5 text-muted-foreground" />
            Quick Summary
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={onGenerateNewsletter}
            className="flex items-center gap-2 px-3 py-2 text-xs text-foreground cursor-pointer hover:bg-muted transition-colors outline-none"
          >
            <Newspaper className="w-3.5 h-3.5 text-muted-foreground" />
            Generate Newsletter
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="h-px bg-border my-1" />
          <DropdownMenu.Item
            onSelect={onBulkProcess}
            className="flex items-center gap-2 px-3 py-2 text-xs text-foreground cursor-pointer hover:bg-muted transition-colors outline-none"
          >
            <Cpu className="w-3.5 h-3.5 text-muted-foreground" />
            Bulk AI Process
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={onExportSelected}
            className="flex items-center gap-2 px-3 py-2 text-xs text-foreground cursor-pointer hover:bg-muted transition-colors outline-none"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            Export Selected
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
