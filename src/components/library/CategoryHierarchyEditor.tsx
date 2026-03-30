'use client';

import React, { useState } from 'react';
import { Plus, X, ChevronDown, ChevronRight } from 'lucide-react';
import { CategoryNode } from '@/types';
import { cn } from '@/lib/utils';

interface CategoryHierarchyEditorProps {
  hierarchy: CategoryNode[];
  onChange: (hierarchy: CategoryNode[]) => void;
}

export function CategoryHierarchyEditor({ hierarchy, onChange }: CategoryHierarchyEditorProps) {
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(hierarchy.map((n) => n.id)));
  const [newCatName, setNewCatName] = useState('');
  const [newSubInputs, setNewSubInputs] = useState<Record<string, string>>({});

  const toggleExpand = (id: string) => {
    setExpandedCats((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const addCategory = () => {
    const name = newCatName.trim();
    if (!name) return;
    const id = `cat-${Date.now()}`;
    onChange([...hierarchy, { id, category: name, subcategories: [] }]);
    setExpandedCats((prev) => new Set(prev).add(id));
    setNewCatName('');
  };

  const removeCategory = (id: string) => {
    onChange(hierarchy.filter((n) => n.id !== id));
  };

  const updateCategoryName = (id: string, name: string) => {
    onChange(hierarchy.map((n) => (n.id === id ? { ...n, category: name } : n)));
  };

  const addSubcategory = (catId: string) => {
    const name = (newSubInputs[catId] || '').trim();
    if (!name) return;
    onChange(
      hierarchy.map((n) =>
        n.id === catId && !n.subcategories.includes(name)
          ? { ...n, subcategories: [...n.subcategories, name] }
          : n
      )
    );
    setNewSubInputs((prev) => ({ ...prev, [catId]: '' }));
  };

  const removeSubcategory = (catId: string, sub: string) => {
    onChange(
      hierarchy.map((n) =>
        n.id === catId ? { ...n, subcategories: n.subcategories.filter((s) => s !== sub) } : n
      )
    );
  };

  return (
    <div className="space-y-2">
      {hierarchy.map((node) => (
        <div key={node.id} className="border border-border rounded-md overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 bg-muted/50">
            <button
              type="button"
              onClick={() => toggleExpand(node.id)}
              className="text-muted-foreground hover:text-foreground"
            >
              {expandedCats.has(node.id) ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
            <input
              value={node.category}
              onChange={(e) => updateCategoryName(node.id, e.target.value)}
              className="flex-1 text-sm font-medium bg-transparent border-none focus:outline-none text-foreground"
            />
            <span className="text-[11px] text-muted-foreground">
              {node.subcategories.length} sub
            </span>
            <button
              type="button"
              onClick={() => removeCategory(node.id)}
              className="text-muted-foreground hover:text-exclude transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {expandedCats.has(node.id) && (
            <div className="px-3 py-2 pl-8 space-y-1.5">
              {node.subcategories.map((sub) => (
                <div
                  key={sub}
                  className="flex items-center gap-2 text-xs text-foreground"
                >
                  <span className="flex-1">{sub}</span>
                  <button
                    type="button"
                    onClick={() => removeSubcategory(node.id, sub)}
                    className="text-muted-foreground hover:text-exclude transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
              <div className="flex gap-1.5 mt-1">
                <input
                  value={newSubInputs[node.id] || ''}
                  onChange={(e) =>
                    setNewSubInputs((prev) => ({ ...prev, [node.id]: e.target.value }))
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addSubcategory(node.id);
                    }
                  }}
                  placeholder="Add subcategory..."
                  className="flex-1 h-7 px-2 text-xs bg-card border border-border rounded focus:outline-none focus:ring-1 focus:ring-accent"
                />
                <button
                  type="button"
                  onClick={() => addSubcategory(node.id)}
                  className="h-7 px-2 bg-accent text-white rounded text-xs hover:bg-accent/90"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}
        </div>
      ))}

      <div className="flex gap-2 mt-2">
        <input
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addCategory();
            }
          }}
          placeholder="Add new category..."
          className="flex-1 h-8 px-3 text-sm bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <button
          type="button"
          onClick={addCategory}
          disabled={!newCatName.trim()}
          className={cn(
            'h-8 px-3 text-xs border rounded transition-colors flex items-center gap-1',
            newCatName.trim()
              ? 'text-accent border-accent/30 hover:bg-accent-muted'
              : 'text-muted-foreground border-border opacity-40'
          )}
        >
          <Plus className="w-3.5 h-3.5" />
          Add Category
        </button>
      </div>
    </div>
  );
}
