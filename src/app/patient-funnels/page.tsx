'use client';

import React, { useState } from 'react';
import {
  Plus,
  Save,
  TrendingDown,
  Trash2,
  Download,
  ChevronRight,
  X,
  MessageSquare,
} from 'lucide-react';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AppShell } from '@/components/layout/AppShell';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Dialog, DialogContent } from '@/components/ui/Dialog';
import { SectionLabel, PageHeader } from '@/components/ui/SectionLabel';
import { FunnelVisualization } from '@/components/patient-funnels/FunnelVisualization';
import { FunnelLevelModal } from '@/components/patient-funnels/FunnelLevelModal';
import { useFunnelStore, COUNTRIES } from '@/store/funnels';
import { Funnel, FunnelLevel, FunnelArticle } from '@/types';
import { cn, formatDate, getRelativeTime, generateId } from '@/lib/utils';

const COUNTRY_OPTIONS = COUNTRIES.map((c) => ({
  value: c.code,
  label: `${c.flag} ${c.name}`,
}));

export default function PatientFunnelsPage() {
  const {
    funnels,
    activeFunnelId,
    setActiveFunnel,
    createFunnel,
    updateFunnel,
    deleteFunnel,
    addLevel,
    updateLevel,
    deleteLevel,
    addArticleToLevel,
    updateArticleInLevel,
    removeArticleFromLevel,
  } = useFunnelStore();

  const activeFunnel = funnels.find((f) => f.id === activeFunnelId) || null;

  const [showNewFunnelModal, setShowNewFunnelModal] = useState(false);
  const [activeLevelModal, setActiveLevelModal] = useState<FunnelLevel | null>(null);

  // New funnel form
  const [newFunnelName, setNewFunnelName] = useState('');
  const [newFunnelCountry, setNewFunnelCountry] = useState('US');
  const [newFunnelIndication, setNewFunnelIndication] = useState('');
  const [newFunnelDesc, setNewFunnelDesc] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'ai' | 'user'; content: string }>>([
    {
      role: 'ai',
      content:
        "Hello! I'll help you set up a new patient funnel. What product and indication would you like to model?",
    },
  ]);
  const [chatInput, setChatInput] = useState('');

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput.trim();
    setChatMessages((prev) => [...prev, { role: 'user', content: userMsg }]);
    setChatInput('');

    // Simulate AI response
    setTimeout(() => {
      const response = generateAIResponse(userMsg, chatMessages.length);
      setChatMessages((prev) => [...prev, { role: 'ai', content: response }]);
    }, 800);
  };

  const generateAIResponse = (msg: string, turn: number): string => {
    const responses = [
      "Great! And what country or region would you like to model? We support US, UK, France, Germany, Italy, Spain, China, and Japan.",
      "Perfect. Can you describe the key patient journey steps? For example: Total population → Diagnosed patients → Treated patients → Eligible for therapy → Biologic-treated.",
      "Excellent context! I've noted the levels. Let me help you structure this funnel. You can now fill in the form details and create the funnel.",
      "Your funnel is ready to be created. Click 'Create Funnel' when you're ready!",
    ];
    return responses[Math.min(turn - 1, responses.length - 1)];
  };

  const handleCreateFunnel = () => {
    if (!newFunnelName.trim()) return;
    const funnel = createFunnel({
      name: newFunnelName,
      country: newFunnelCountry,
      indication: newFunnelIndication,
      description: newFunnelDesc,
      levels: [
        {
          id: `level-${generateId()}`,
          name: 'Total Population',
          description: 'Total population in the country',
          percentage: 100,
          value: COUNTRIES.find((c) => c.code === newFunnelCountry)?.population,
          linkedArticles: [],
        },
      ],
    });
    setActiveFunnel(funnel.id);
    setShowNewFunnelModal(false);
    setNewFunnelName('');
    setNewFunnelIndication('');
    setNewFunnelDesc('');
    setChatMessages([
      {
        role: 'ai',
        content: "Hello! I'll help you set up a new patient funnel. What product and indication would you like to model?",
      },
    ]);
  };

  const handleAddLevel = () => {
    if (!activeFunnel) return;
    addLevel(activeFunnel.id, {
      name: 'New Level',
      description: '',
      percentage: 0,
      linkedArticles: [],
    });
  };

  const countryData = (code: string) => COUNTRIES.find((c) => c.code === code);

  return (
    <AuthGuard>
      <AppShell>
        <div className="flex flex-col h-full overflow-hidden">
          {/* Top Half — Funnel Workspace */}
          <div className="flex-1 border-b border-border overflow-auto">
            {!activeFunnel ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-16 px-4">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                  <TrendingDown className="w-7 h-7 text-muted-foreground" />
                </div>
                <h3 className="font-serif text-xl text-foreground mb-2">No Funnel Selected</h3>
                <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                  Select an existing funnel from the list below or create a new one to start modelling patient pathways.
                </p>
                <Button
                  variant="primary"
                  leftIcon={<MessageSquare className="w-4 h-4" />}
                  onClick={() => setShowNewFunnelModal(true)}
                >
                  New Funnel
                </Button>
              </div>
            ) : (
              <div className="p-6 max-w-4xl mx-auto">
                {/* Funnel Header */}
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xl">{countryData(activeFunnel.country)?.flag}</span>
                      <h2 className="font-serif text-xl font-semibold">{activeFunnel.name}</h2>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-accent px-2 py-0.5 bg-accent-muted rounded border border-accent/10">
                        {activeFunnel.indication}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {countryData(activeFunnel.country)?.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        · {activeFunnel.levels.length} levels
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" leftIcon={<Download className="w-3.5 h-3.5" />}>
                      Export
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      leftIcon={<Plus className="w-3.5 h-3.5" />}
                      onClick={handleAddLevel}
                    >
                      Add Level
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      leftIcon={<Save className="w-3.5 h-3.5" />}
                      onClick={() => updateFunnel(activeFunnel.id, {})}
                    >
                      Save
                    </Button>
                  </div>
                </div>

                {/* Funnel Visualization */}
                <FunnelVisualization
                  funnel={activeFunnel}
                  onLevelClick={(level) => setActiveLevelModal(level)}
                />

                <p className="text-center text-xs text-muted-foreground mt-3">
                  Click any level to view linked publications and edit values
                </p>
              </div>
            )}
          </div>

          {/* Bottom Half — Saved Funnels */}
          <div className="h-64 overflow-auto bg-card">
            <div className="px-6 py-3 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-sm font-semibold text-foreground">Saved Funnels</h3>
                <span className="text-xs text-muted-foreground">({funnels.length})</span>
              </div>
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={() => setShowNewFunnelModal(true)}
              >
                New Funnel
              </Button>
            </div>

            {funnels.length === 0 ? (
              <div className="flex items-center justify-center h-32 text-sm text-muted-foreground">
                No funnels saved yet.
              </div>
            ) : (
              <table className="data-table min-w-full">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Country</th>
                    <th>Indication</th>
                    <th>Levels</th>
                    <th>Last Saved</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {funnels.map((funnel) => {
                    const country = countryData(funnel.country);
                    const isActive = funnel.id === activeFunnelId;
                    return (
                      <tr
                        key={funnel.id}
                        className={cn(isActive && 'bg-accent-muted')}
                      >
                        <td>
                          <button
                            onClick={() => setActiveFunnel(funnel.id)}
                            className={cn(
                              'text-xs font-medium text-left hover:text-accent transition-colors',
                              isActive ? 'text-accent' : 'text-foreground'
                            )}
                          >
                            {funnel.name}
                          </button>
                        </td>
                        <td>
                          <span className="text-xs text-foreground">
                            {country?.flag} {country?.name}
                          </span>
                        </td>
                        <td>
                          <span className="text-xs text-muted-foreground">{funnel.indication}</span>
                        </td>
                        <td>
                          <span className="text-xs text-muted-foreground">{funnel.levels.length}</span>
                        </td>
                        <td>
                          <span className="text-xs text-muted-foreground">
                            {getRelativeTime(funnel.updatedAt)}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setActiveFunnel(funnel.id)}
                              className="text-xs text-accent hover:text-accent/80 flex items-center gap-0.5"
                            >
                              Open <ChevronRight className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm('Delete this funnel?')) {
                                  if (activeFunnelId === funnel.id) setActiveFunnel(null);
                                  deleteFunnel(funnel.id);
                                }
                              }}
                              className="text-muted-foreground hover:text-exclude transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* New Funnel Chat Modal */}
        <Dialog open={showNewFunnelModal} onOpenChange={(o) => !o && setShowNewFunnelModal(false)}>
          <DialogContent size="lg" title="Create New Patient Funnel">
            <div className="space-y-4">
              {/* Chat section */}
              <div className="bg-muted rounded-md p-3 space-y-2 max-h-40 overflow-y-auto">
                {chatMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={cn(
                      'text-xs rounded-md px-3 py-2 max-w-[85%]',
                      msg.role === 'ai'
                        ? 'bg-card border border-border text-foreground'
                        : 'bg-accent text-white ml-auto'
                    )}
                  >
                    {msg.content}
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleChatSend()}
                  placeholder="Describe your funnel..."
                  className="flex-1 h-8 px-3 text-xs bg-card border border-border rounded focus:outline-none focus:ring-2 focus:ring-accent"
                />
                <Button size="sm" variant="primary" onClick={handleChatSend}>
                  Send
                </Button>
              </div>

              {/* Form */}
              <div className="border-t border-border pt-4 space-y-3">
                <p className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Funnel Details</p>
                <div className="grid grid-cols-2 gap-3">
                  <Input
                    label="Funnel Name"
                    value={newFunnelName}
                    onChange={(e) => setNewFunnelName(e.target.value)}
                    placeholder="e.g. AD Biologic-Eligible Patients"
                    required
                  />
                  <Select
                    label="Country"
                    value={newFunnelCountry}
                    onValueChange={setNewFunnelCountry}
                    options={COUNTRY_OPTIONS}
                  />
                </div>
                <Input
                  label="Indication"
                  value={newFunnelIndication}
                  onChange={(e) => setNewFunnelIndication(e.target.value)}
                  placeholder="e.g. Atopic Dermatitis"
                />
                <Textarea
                  label="Description (Optional)"
                  value={newFunnelDesc}
                  onChange={(e) => setNewFunnelDesc(e.target.value)}
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setShowNewFunnelModal(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleCreateFunnel}
                  disabled={!newFunnelName.trim()}
                >
                  Create Funnel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Level Editor Modal */}
        {activeFunnel && (
          <FunnelLevelModal
            level={activeLevelModal}
            funnelId={activeFunnel.id}
            open={!!activeLevelModal}
            onClose={() => setActiveLevelModal(null)}
            onUpdateLevel={(levelId, data) => updateLevel(activeFunnel.id, levelId, data)}
            onUpdateArticle={(levelId, articleId, data) =>
              updateArticleInLevel(activeFunnel.id, levelId, articleId, data)
            }
            onRemoveArticle={(levelId, articleId) =>
              removeArticleFromLevel(activeFunnel.id, levelId, articleId)
            }
            onAddArticle={(levelId, article) => addArticleToLevel(activeFunnel.id, levelId, article)}
          />
        )}
      </AppShell>
    </AuthGuard>
  );
}
