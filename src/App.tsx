import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Cpu, 
  Zap, 
  Play, 
  Settings, 
  Layers, 
  FileCode, 
  Search, 
  Terminal,
  Activity,
  ChevronRight,
  ShieldCheck,
  AlertCircle,
  Save,
  Undo2,
  Redo2,
  Plus,
  Eye,
  EyeOff,
  Download,
  Trash2,
  FolderOpen,
  Palette,
  X,
  Code2,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useStudioStore, ThemePreset } from './store';
import { GraphView } from './components/GraphView';
import { diffNcgs } from './lib/compiler/diff';
import { 
  buildJdCardArtifact, 
  downloadJdCardJson, 
  downloadReactBundle 
} from './lib/compiler/export';

const DEFAULT_SPEC = `openapi: 3.0.0
info:
  title: SignageOS - Device Management
  version: 1.2.0
paths:
  /devices:
    get:
      summary: List all devices
      tags: [Device]
  /devices/{id}/reboot:
    post:
      summary: Reboot a device
      tags: [Device]
`;

export default function App() {
  const { 
    ncg, 
    ir, 
    intent,
    goal, 
    refinement,
    isCompiling, 
    isRefining,
    error, 
    setGoal, 
    ingestSpec, 
    refineGoal,
    applyRefinedGoal,
    compile,
    reset,
    model,
    setModel,
    themePreset,
    setThemePreset,
    savedCards,
    saveCurrentCard,
    deleteSavedCard,
    loadSavedCard,
    sourceSpec,
    compiledNcg,
    stagingIntent,
    hasConfirmedIntent,
    updateStagingParameter,
    finalizeIntent,
    syncCompiledNcg
  } = useStudioStore();

  const [activeTab, setActiveTab] = useState<'INGEST' | 'INTENT' | 'COMPILE' | 'TEST' | 'LAB' | 'PREVIEW'>('INGEST');
  const [reachedTab, setReachedTab] = useState<'INGEST' | 'INTENT' | 'COMPILE' | 'TEST' | 'LAB' | 'PREVIEW'>('INGEST');
  const [groqKey, setGroqKey] = useState('');
  const [openRouterKey, setOpenRouterKey] = useState('');
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [projectTitle, setProjectTitle] = useState('Untitled Project');
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const triggerNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  const updateTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    const tabs: typeof activeTab[] = ['INGEST', 'INTENT', 'COMPILE', 'TEST', 'LAB', 'PREVIEW'];
    if (tabs.indexOf(tab) > tabs.indexOf(reachedTab)) {
      setReachedTab(tab);
    }
  };

  const handleReset = () => {
    reset();
    setActiveTab('INGEST');
    setReachedTab('INGEST');
  };

  useEffect(() => {
    ingestSpec(DEFAULT_SPEC);
  }, []);

  const handleCompile = async () => {
    await compile();
  };

  const isReachable = (tab: typeof activeTab) => {
    const tabs: typeof activeTab[] = ['INGEST', 'INTENT', 'COMPILE', 'TEST', 'LAB', 'PREVIEW'];
    return tabs.indexOf(tab) <= tabs.indexOf(reachedTab);
  };

  return (
    <div className={`min-h-screen font-sans transition-colors duration-200 overflow-x-hidden ${
      themePreset === 'dark' ? 'bg-zinc-950 text-zinc-100 selection:bg-blue-500/30' :
      themePreset === 'cyberpunk' ? 'bg-yellow-300 text-black selection:bg-fuchsia-500/30' :
      'bg-[#F2F2F2] text-black selection:bg-brutal-blue/30'
    }`}>
      {/* Top Utility Header */}
      <header className="bg-white border-b-2 border-black px-4 py-3 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 border-2 border-black bg-white flex items-center justify-center shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
             <div className="w-6 h-1 bg-black rotate-90 absolute"></div>
             <div className="w-6 h-1 bg-black -rotate-45 relative"></div>
          </div>
          <div className="flex flex-col">
            <input 
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              className="font-serif text-xl italic leading-tight bg-transparent border-none focus:outline-none"
            />
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#777]">ENGINE_STATUS: DRAFT_SPEC</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
           {/* Theme Preset Selector */}
           <div className="hidden sm:flex items-center gap-1.5 border-2 border-black px-2.5 py-1.5 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
             <Palette size={14} className="text-zinc-500" />
             <select 
               value={themePreset}
               onChange={(e) => setThemePreset(e.target.value as ThemePreset)}
               className="text-[10px] font-mono font-bold bg-transparent border-none focus:outline-none uppercase tracking-tighter"
             >
               <option value="brutal">Brutal Light</option>
               <option value="dark">Tech Dark</option>
               <option value="cyberpunk">Cyberpunk</option>
             </select>
           </div>

           <div className="hidden lg:flex items-center gap-2 border-2 border-black px-3 py-1.5 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
             <Cpu size={14} className="text-zinc-400" />
             <select 
               value={model}
               onChange={(e) => setModel(e.target.value)}
               className="text-[10px] font-mono font-bold bg-transparent border-none focus:outline-none uppercase tracking-tighter"
             >
               <option value="gemini-3.5-flash">Gemini 3.5 Flash</option>
               <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Preview)</option>
               <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite</option>
             </select>
           </div>

           <button 
             onClick={() => setShowSavedModal(true)}
             title="View Saved Micro-Apps"
             className="flex items-center gap-1.5 border-2 border-black px-3 py-2 bg-amber-400 text-black text-[10px] font-mono font-bold uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
           >
              <FolderOpen size={14} />
              <span className="hidden md:inline">SAVED_CARDS ({savedCards.length})</span>
           </button>
           
           <button 
             onClick={handleReset}
             title="Create New Project"
             className="flex items-center gap-2 border-2 border-black px-4 py-2 bg-zinc-900 text-white text-[10px] font-mono font-bold uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[5px_5px_0px_0px_rgba(0,0,0,1)] transition-all active:translate-x-[2px] active:translate-y-[2px] active:shadow-none"
           >
              <Plus size={14} />
              <span className="hidden md:inline">NEW_PROJECT</span>
           </button>
           
           <button 
             onClick={() => alert("Project configurations persisted to IndexedDB storage.")}
             className="border-2 border-black p-2 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] active:shadow-none translate-y-0 active:translate-x-[2px] active:translate-y-[2px]"
           >
              <Save size={18} />
           </button>
           
           <div className="hidden sm:flex border-2 border-black bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
              <button className="p-2 border-r-2 border-black hover:bg-zinc-100 transition-colors"><Undo2 size={18}/></button>
              <button className="p-2 hover:bg-zinc-100 transition-colors"><Redo2 size={18}/></button>
           </div>
           
           <button 
             onClick={() => setIsReadOnly(!isReadOnly)}
             className={`hidden sm:flex items-center gap-2 border-2 border-black px-4 py-2 text-[10px] font-mono font-bold uppercase shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] transition-all ${isReadOnly ? 'bg-zinc-100 text-zinc-400' : 'bg-white text-black'}`}
           >
             {isReadOnly ? <EyeOff size={14} /> : <Eye size={14} />}
             <span className="hidden md:inline">{isReadOnly ? 'WRITE_LOCKED' : 'MODE_STAGING'}</span>
           </button>
        </div>
      </header>

      {/* Pipeline Navigation */}
      <div className="bg-[#F2F2F2] border-b border-zinc-300 px-4 pt-4 overflow-x-auto">
        <div className="flex min-w-max gap-8 pb-1">
          <PipelineNavItem id="01" label="INGEST" active={activeTab === 'INGEST'} onClick={() => updateTab('INGEST')} />
          <PipelineNavItem id="02" label="INTENT" active={activeTab === 'INTENT'} onClick={() => updateTab('INTENT')} />
          <PipelineNavItem id="03" label="COMPILE" active={activeTab === 'COMPILE'} onClick={() => updateTab('COMPILE')} disabled={!isReachable('COMPILE')} />
          <PipelineNavItem id="04" label="TEST" active={activeTab === 'TEST'} onClick={() => updateTab('TEST')} disabled={!isReachable('TEST')} />
          <PipelineNavItem id="05" label="LAB" active={activeTab === 'LAB'} onClick={() => updateTab('LAB')} disabled={!isReachable('LAB')} />
          <PipelineNavItem id="06" label="PREVIEW" active={activeTab === 'PREVIEW'} onClick={() => updateTab('PREVIEW')} disabled={!isReachable('PREVIEW')} />
        </div>
      </div>

      {/* Main Surface */}
      <main className="p-4 sm:p-8 max-w-2xl mx-auto space-y-8">
        <AnimatePresence mode="wait">
          {activeTab === 'INGEST' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="brutal-card p-8 space-y-6 text-center sm:text-left">
                <div className="space-y-2">
                  <h2 className="font-serif text-4xl italic">Capability Discovery</h2>
                  <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">STAGE 01 // NORMALIZE & MAP OPENAPI SURFACE</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="border border-zinc-200">
                    <div className="bg-zinc-50 px-4 py-2 border-b flex items-center gap-2">
                      <Terminal size={14} className="text-zinc-400" />
                      <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">GROQ_API_KEY</span>
                    </div>
                    <div className="p-4">
                      <input 
                        type="password" 
                        disabled={isReadOnly}
                        value={groqKey}
                        onChange={(e) => setGroqKey(e.target.value)}
                        placeholder="sk-..."
                        className="w-full font-mono text-xs bg-transparent border-none focus:outline-none"
                      />
                    </div>
                  </div>
                  <div className="border border-zinc-200">
                    <div className="bg-zinc-50 px-4 py-2 border-b flex items-center gap-2">
                      <Terminal size={14} className="text-zinc-400" />
                      <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">OPENROUTER_KEY</span>
                    </div>
                    <div className="p-4">
                      <input 
                        type="password" 
                        disabled={isReadOnly}
                        value={openRouterKey}
                        onChange={(e) => setOpenRouterKey(e.target.value)}
                        placeholder="sk-or-..."
                        className="w-full font-mono text-xs bg-transparent border-none focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                <div className="border border-zinc-200">
                  <div className="bg-zinc-50 px-4 py-2 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database size={14} className="text-zinc-400" />
                      <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">OPENAPI SOURCE SPECIFICATION</span>
                    </div>
                    <span className="text-[8px] font-mono bg-zinc-200 text-zinc-700 px-1.5 py-0.5 uppercase tracking-tighter">YAML/JSON</span>
                  </div>
                  <div className="p-4">
                    <textarea 
                      value={sourceSpec}
                      disabled={isReadOnly}
                      onChange={(e) => ingestSpec(e.target.value)}
                      placeholder="Paste OpenAPI spec here..."
                      className="w-full h-48 p-4 font-mono text-xs bg-white border border-zinc-200 focus:outline-none resize-y"
                    />
                  </div>
                </div>

                <div className="flex items-center gap-3 py-1">
                  <input type="checkbox" defaultChecked className="w-5 h-5 accent-brutal-blue border-2 border-black rounded-none" />
                  <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">ENABLE HEURISTIC AUTO-FIX ENGINE</span>
                </div>

                <button onClick={() => updateTab('INTENT')} className="brutal-button w-full text-sm py-5 font-black">
                  BUILD CAPABILITY GRAPH
                </button>
              </div>

              {/* Visual Diff for API Drift Detection */}
              {(() => {
                const driftDiff = diffNcgs(compiledNcg, ncg);
                if (!driftDiff.hasDrift) return null;

                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="border-2 border-amber-500 bg-amber-50/20 p-6 space-y-4 shadow-[4px_4px_0px_#f59e0b]"
                  >
                    <div className="flex items-center gap-2.5 text-amber-600">
                      <AlertCircle size={18} />
                      <span className="font-mono text-xs font-black uppercase tracking-wider">API Schema Drift Detected</span>
                    </div>
                    
                    <p className="text-xs text-zinc-600 font-serif leading-relaxed italic">
                      The current OpenAPI spec in the editor differs from the compiled baseline. Inspect the specific changes below:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* Baseline */}
                      <div className="border border-zinc-200 bg-white p-4 space-y-2">
                        <h4 className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-wider">Compiled Baseline</h4>
                        <div className="space-y-1 text-[11px] font-mono">
                          <div className="text-zinc-500">Entities ({compiledNcg?.entities.length || 0}):</div>
                          <div className="flex flex-wrap gap-1">
                            {compiledNcg?.entities.map(e => (
                              <span key={e.id} className="bg-zinc-100 px-1.5 py-0.5 border text-zinc-700 text-[10px] rounded-sm">{e.name}</span>
                            ))}
                          </div>
                          <div className="text-zinc-500 pt-1">Actions ({compiledNcg?.actions.length || 0}):</div>
                          <div className="text-zinc-700 max-h-32 overflow-y-auto space-y-1 pr-1">
                            {compiledNcg?.actions.map(a => (
                              <div key={a.id} className="truncate text-[9px] bg-zinc-50 p-1 border border-zinc-100">{a.name}</div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Drift Differences */}
                      <div className="border border-amber-200 bg-white p-4 space-y-2">
                        <h4 className="text-[10px] font-mono font-bold text-amber-600 uppercase tracking-wider">Detected Modifications</h4>
                        
                        <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                          {/* Entity Changes */}
                          {(driftDiff.entities.added.length > 0 || driftDiff.entities.removed.length > 0 || driftDiff.entities.modified.length > 0) && (
                            <div className="space-y-1.5">
                              <div className="text-[9px] font-mono font-bold text-zinc-400 uppercase">Entities:</div>
                              {driftDiff.entities.added.map(name => (
                                <div key={name} className="flex items-center gap-1.5 text-xs text-emerald-600 font-mono">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                  <span>Added: <strong className="font-bold">{name}</strong></span>
                                </div>
                              ))}
                              {driftDiff.entities.removed.map(name => (
                                <div key={name} className="flex items-center gap-1.5 text-xs text-red-600 font-mono">
                                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                  <span>Removed: <strong className="font-bold">{name}</strong></span>
                                </div>
                              ))}
                              {driftDiff.entities.modified.map(m => (
                                <div key={m.id} className="text-xs text-amber-700 font-mono space-y-0.5 border-l-2 border-amber-300 pl-2">
                                  <div className="font-bold">Modified: {m.id}</div>
                                  {m.changes.map((c, idx) => (
                                    <div key={idx} className="text-[10px] text-zinc-600 pl-2">↳ {c}</div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Action Changes */}
                          {(driftDiff.actions.added.length > 0 || driftDiff.actions.removed.length > 0 || driftDiff.actions.modified.length > 0) && (
                            <div className="space-y-1.5 pt-2 border-t border-dashed border-zinc-200">
                              <div className="text-[9px] font-mono font-bold text-zinc-400 uppercase">Actions:</div>
                              {driftDiff.actions.added.map(name => (
                                <div key={name} className="flex items-center gap-1.5 text-xs text-emerald-600 font-mono">
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                  <span>Added: <strong className="font-bold">{name}</strong></span>
                                </div>
                              ))}
                              {driftDiff.actions.removed.map(name => (
                                <div key={name} className="flex items-center gap-1.5 text-xs text-red-600 font-mono">
                                  <span className="w-1.5 h-1.5 bg-red-500 rounded-full" />
                                  <span>Removed: <strong className="font-bold">{name}</strong></span>
                                </div>
                              ))}
                              {driftDiff.actions.modified.map(m => (
                                <div key={m.id} className="text-xs text-amber-700 font-mono space-y-0.5 border-l-2 border-amber-300 pl-2">
                                  <div className="font-bold">Modified: {m.id}</div>
                                  {m.changes.map((c, idx) => (
                                    <div key={idx} className="text-[10px] text-zinc-600 pl-2">↳ {c}</div>
                                  ))}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <button 
                        onClick={syncCompiledNcg}
                        className="px-4 py-2 bg-amber-500 text-white font-mono text-[10px] font-bold uppercase shadow-[2px_2px_0px_#92400e] hover:translate-x-[-1px] hover:translate-y-[-1px] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none transition-all"
                      >
                        Accept Changes & Sync Baseline
                      </button>
                    </div>
                  </motion.div>
                );
              })()}

              <div className="brutal-card p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} className="text-zinc-500" />
                  <span className="text-[10px] font-mono font-bold text-black uppercase tracking-widest">CAPABILITY GRAPH STATE</span>
                </div>
                <div className="space-y-2">
                  <StatRow label="AVAILABLE NODES" value={ncg?.actions.length.toString().padStart(2, '0') + 'x' + ncg?.entities.length.toString().padStart(2, '0') || '0x0'} />
                  <StatRow label="SAFE VERTICES" value="08" />
                  <div className="flex justify-between items-center py-2">
                    <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">ENGINE STATUS</span>
                    <span className="bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-sm font-mono text-[10px] font-bold">STABLE_IDLE</span>
                  </div>
                </div>
              </div>

              <div className="border-2 border-brutal-blue/40 bg-brutal-blue/5 p-8 space-y-4">
                <h3 className="text-[11px] font-mono font-bold text-brutal-blue uppercase tracking-widest">PROJECT CONTEXT</h3>
                <p className="text-zinc-500 text-xs italic font-serif leading-relaxed">
                  API TaskApp Compiler Studio uses a layered orchestration compiler to map semantic intent to normalized capability graphs. All executions are auditable and schema-constrained by default.
                </p>
              </div>
            </motion.div>
          )}

          {activeTab === 'INTENT' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
              <div className="brutal-card p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="font-serif text-4xl italic">Intent Synthesis</h2>
                  </div>
                  <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">STAGE 02 // SEMANTIC OBJECT MAPPING</p>
                </div>

                <div className="border-2 border-black bg-[#F8F8F8] relative">
                  <div className="absolute -top-[1.5px] -left-[1.5px] bg-black text-white px-2 py-1 flex items-center gap-1">
                    <Terminal size={10} />
                    <span className="text-[8px] font-mono font-bold tracking-widest">PROMPT</span>
                  </div>
                  <textarea 
                    value={goal}
                    disabled={isReadOnly}
                    onChange={(e) => setGoal(e.target.value)}
                    placeholder="Enter operational mission parameters..."
                    className={`w-full h-48 p-8 pt-10 bg-transparent text-sm font-mono focus:outline-none resize-none ${isReadOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>

                <div className="flex flex-wrap gap-2 pt-2">
                   <SuggestChip label="BATCH REBOOT" onClick={() => setGoal("Reboot all devices in the Boston office.")} />
                   <SuggestChip label="FIRMWARE UPDATE" onClick={() => setGoal("Update devices with firmware v1.0 to v2.1.")} />
                </div>

                <button 
                  onClick={handleCompile}
                  disabled={isCompiling || !goal}
                  className="brutal-button brutal-button-blue w-full text-sm py-5 font-black flex items-center justify-center gap-3"
                >
                  <Zap size={16} fill="white" />
                  {isCompiling ? "COMPILING IR DAG..." : "SYNTHESIZE COMPILER PLAN"}
                </button>

                <button 
                  onClick={refineGoal}
                  disabled={isRefining || !goal}
                  className="brutal-button w-full text-xs py-3 font-bold border-zinc-400 bg-white shadow-[3px_3px_0px_0px_rgba(0,0,0,0.2)] flex items-center justify-center gap-3"
                >
                  <Search size={14} />
                  {isRefining ? "ANALYZING GOAL..." : "ENHANCE GOAL WITH AI"}
                </button>

                {refinement && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 border-2 border-dashed border-black bg-white space-y-6"
                  >
                    <div className="space-y-4">
                      <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-zinc-400">Clarifying Questions</h4>
                      <ul className="space-y-2">
                        {refinement.clarifyingQuestions.map((q, i) => (
                          <li key={i} className="text-xs font-serif italic border-l-2 border-zinc-200 pl-3 py-1">
                            {q}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-500">Suggested Refinement</h4>
                      <div className="p-4 bg-emerald-50 border-2 border-emerald-500 text-xs font-mono leading-relaxed">
                        {refinement.suggestedGoal}
                      </div>
                      <button 
                        onClick={() => applyRefinedGoal(refinement.suggestedGoal)}
                        className="w-full py-2 bg-emerald-500 text-white text-[10px] font-mono font-bold uppercase hover:bg-emerald-600 transition-colors"
                      >
                        APPLY REFINED MISSION
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* AI suggested action parameter calibration staging area */}
                {stagingIntent && !hasConfirmedIntent && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }} 
                    animate={{ opacity: 1, y: 0 }} 
                    className="border-2 border-brutal-blue bg-[#FCFDFF] p-6 space-y-6 shadow-[4px_4px_0px_#2563eb] mt-6"
                  >
                    <div className="space-y-1">
                      <h3 className="font-serif text-2xl italic flex items-center gap-2">
                        <Settings size={18} className="text-brutal-blue animate-spin" style={{ animationDuration: '6s' }} />
                        Action Parameter Calibration
                      </h3>
                      <p className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">
                        Verify or modify AI's suggested parameters before final compilation
                      </p>
                    </div>

                    <div className="space-y-4">
                      {stagingIntent.actions.map(actionId => {
                        const action = ncg?.actions.find(a => a.id === actionId);
                        const params = stagingIntent.parameters?.filter(p => p.actionId === actionId) || [];

                        return (
                          <div key={actionId} className="border border-zinc-200 bg-white p-4 space-y-3">
                            <div className="flex items-center justify-between border-b pb-2">
                              <span className="text-[10px] font-mono font-bold text-zinc-700 uppercase">
                                Action: <strong className="text-brutal-blue">{action?.name || actionId}</strong>
                              </span>
                              <span className="text-[8px] font-mono bg-zinc-200 text-zinc-600 px-1.5 py-0.5 font-bold uppercase">
                                {action?.method || 'POST'}
                              </span>
                            </div>

                            {params.length === 0 ? (
                              <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase italic">
                                No parameters require configuration
                              </p>
                            ) : (
                              <div className="space-y-3 text-left">
                                {params.map(p => (
                                  <div key={p.paramName} className="space-y-1">
                                    <label className="flex items-center justify-between text-[10px] font-mono font-bold text-zinc-500 uppercase">
                                      <span>{p.paramName} <span className="text-zinc-400 font-normal">[{p.in}]</span></span>
                                      {p.in === 'path' && <span className="text-amber-500 lowercase text-[9px]">required</span>}
                                    </label>
                                    
                                    <input 
                                      type="text"
                                      value={p.suggestedValue}
                                      onChange={(e) => updateStagingParameter(actionId, p.paramName, e.target.value)}
                                      className="w-full text-xs font-mono bg-white border-2 border-black p-2 focus:outline-none focus:border-brutal-blue"
                                      placeholder="Enter value..."
                                    />
                                    
                                    <p className="text-[10px] text-zinc-500 font-serif italic leading-tight">
                                      AI Explanation: {p.description}
                                    </p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <button 
                      onClick={() => {
                        finalizeIntent();
                        updateTab('COMPILE');
                      }}
                      className="brutal-button brutal-button-blue w-full py-4 text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <Zap size={14} fill="white" />
                      CONFIRM & FINALIZE INTENT GRAPH
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'COMPILE' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
               <div className="brutal-card p-8 space-y-6">
                <div className="space-y-2">
                  <h2 className="font-serif text-4xl italic">Compiler Verification</h2>
                  <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">STAGE 03 // DETERMINISTIC GRAPH ASSEMBLY</p>
                </div>

                {isCompiling ? (
                  <div className="p-12 border-2 border-dashed border-black flex flex-col items-center gap-4">
                    <Zap size={32} className="text-brutal-blue animate-pulse" />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.2em] animate-pulse">Running IR Optimization...</span>
                  </div>
                ) : (
                  <div className="space-y-3 pt-4">
                    <GraphView ir={ir} />
                    
                    <div className="space-y-1">
                      <h4 className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#777]">Sequential Logic Summary</h4>
                      {ir?.nodes.map((node, i) => (
                        <div key={node.id} className="border border-zinc-200 bg-white flex items-stretch">
                          <div className="w-10 bg-zinc-50 border-r flex items-center justify-center font-bold font-mono text-zinc-300 text-[10px]">{i + 1}</div>
                          <div className="flex-1 p-3 border-l-2 border-black ml-2 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-mono font-bold text-brutal-blue uppercase leading-none">{node.type}</span>
                              <span className="text-[8px] font-mono text-zinc-400">0x{i.toString(16).padStart(2, '0')}</span>
                            </div>
                            <div className="text-[11px] font-bold uppercase truncate">{node.id}</div>
                            {node.config.parameters && node.config.parameters.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-zinc-100 space-y-1">
                                <div className="text-[8px] font-mono text-zinc-400 font-bold uppercase">Configured Parameters:</div>
                                {node.config.parameters.map((p: any) => (
                                  <div key={p.paramName} className="flex justify-between font-mono text-[9px] text-zinc-600 bg-zinc-50 px-1.5 py-0.5 border border-zinc-100">
                                    <span>{p.paramName}:</span>
                                    <span className="font-bold text-black">{p.suggestedValue}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    {(!ir || ir.nodes.length === 0) && (
                      <div className="p-8 border-2 border-dashed border-zinc-200 text-center">
                        <span className="text-[10px] font-mono font-bold text-zinc-300 uppercase tracking-widest text-balance">
                          Awaiting Mission Topology...<br/>Run 'Synthesize' in Stage 02
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {ir && ir.nodes.length > 0 && (
                  <div className="pt-2 border-t-2 border-dashed border-zinc-200 space-y-2">
                    <div className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">EXPORT & PERSIST JDCARD</div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button 
                        onClick={() => {
                          const card = saveCurrentCard(projectTitle);
                          if (card) triggerNotification("Saved jdCard to LocalStorage Library!");
                        }}
                        className="flex items-center justify-center gap-1.5 border-2 border-black bg-amber-400 text-black px-3 py-2 text-[10px] font-mono font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                      >
                        <Save size={12} />
                        SAVE TO LIBRARY
                      </button>

                      <button 
                        onClick={() => {
                          const artifact = buildJdCardArtifact(ir, intent, projectTitle);
                          downloadJdCardJson(artifact);
                          triggerNotification("Downloaded jdCard JSON Package!");
                        }}
                        className="flex items-center justify-center gap-1.5 border-2 border-black bg-white text-black px-3 py-2 text-[10px] font-mono font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                      >
                        <Download size={12} />
                        EXPORT JSON
                      </button>

                      <button 
                        onClick={() => {
                          const artifact = buildJdCardArtifact(ir, intent, projectTitle);
                          downloadReactBundle(artifact);
                          triggerNotification("Exported React Component (.tsx) Bundle!");
                        }}
                        className="flex items-center justify-center gap-1.5 border-2 border-black bg-brutal-blue text-white px-3 py-2 text-[10px] font-mono font-bold uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[-1px] hover:translate-y-[-1px] transition-all"
                      >
                        <Code2 size={12} />
                        EXPORT REACT BUNDLE
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex gap-4">
                  <button 
                    onClick={() => updateTab('INTENT')}
                    className="flex-1 border-2 border-black p-4 font-mono font-bold text-[10px] uppercase hover:bg-zinc-50 tracking-widest transition-colors"
                  >
                    Back to Intent
                  </button>
                  <button 
                    onClick={() => updateTab('TEST')} 
                    disabled={!ir || ir.nodes.length === 0}
                    className="flex-[2] brutal-button brutal-button-blue text-xs font-black py-4 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ASSEMBLE JDCARD ARTIFACT
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'TEST' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
               <div className="brutal-card p-8 space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-end">
                    <h2 className="font-serif text-4xl italic">Unit Testing</h2>
                    <span className="text-[10px] font-mono bg-emerald-500 text-white px-2 py-1 leading-none">PASSING</span>
                  </div>
                  <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">STAGE 04 // MOCK EXECUTION & AUTH CHECK</p>
                </div>

                <div className="space-y-2 border-l-2 border-black pl-4 py-2">
                   <TestResult label="SCHEMA_VAL" status="OK" />
                   <TestResult label="AUTH_SCOPES" status="OK" />
                   <TestResult label="DRY_RUN_OP" status="OK" />
                </div>

                <button onClick={() => updateTab('LAB')} className="brutal-button w-full text-xs font-black py-4 mt-6">
                  PROCEED TO LAB SIMULATION
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'LAB' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
               <div className="brutal-card p-0 overflow-hidden">
                <div className="p-8 space-y-6">
                  <div className="space-y-2">
                    <h2 className="font-serif text-4xl italic">Lab Sandbox</h2>
                    <p className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">STAGE 05 // VIRTUALIZED RUNTIME SIMULATION</p>
                  </div>
                  
                  <div className="bg-zinc-900 aspect-video rounded-none border-2 border-black p-4 font-mono text-[9px] text-[#00FF00] overflow-hidden">
                     <div>[SYS] Initializing Virtual Cluster...</div>
                     <div>[NET] Routing 127.0.0.1 {"->"} {ir?.metadata.targetEntities[0] || 'PET'}...</div>
                     <div className="animate-pulse">[RUN] Compiling bytecode artifacts...</div>
                  </div>
                </div>

                <button onClick={() => updateTab('PREVIEW')} className="w-full bg-black text-white p-6 font-black uppercase text-sm tracking-widest hover:bg-zinc-800 transition-colors">
                  GENERATE FINAL PREVIEW
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === 'PREVIEW' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
               <div className="brutal-card p-0 overflow-hidden border-4">
                  <div className="bg-black text-white p-4 flex justify-between items-center">
                    <span className="text-[12px] font-serif italic tracking-wider">Relational Surface Preview</span>
                    <div className="flex gap-1.5">
                       <div className="w-2.5 h-2.5 bg-white rounded-full"></div>
                       <div className="w-2.5 h-2.5 bg-white rounded-full opacity-30"></div>
                    </div>
                  </div>
                  
                  <div className="p-4 border-b-2 border-black bg-white flex flex-wrap items-center justify-between gap-4">
                     <div className="flex items-center gap-3">
                        <Layers size={14} className="text-brutal-blue" />
                        <span className="text-[11px] font-mono font-black uppercase tracking-widest text-zinc-400">FULL_RELATIONAL_SURFACE</span>
                     </div>
                     <button 
                      onClick={() => {
                        setActiveTab('INGEST');
                        setReachedTab('INGEST');
                      }}
                      className="text-[10px] font-mono font-bold underline hover:text-red-500 uppercase tracking-tighter"
                     >
                       REBOOT ENGINE
                     </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-white border-b-2 border-black">
                          <th className="p-4 text-[11px] uppercase font-black italic tracking-widest px-6">ID_REF</th>
                          <th className="p-4 text-[11px] uppercase font-black italic tracking-widest px-6">IDENTITY</th>
                          <th className="p-4 text-[11px] uppercase font-black italic tracking-widest px-6">STATUS</th>
                        </tr>
                      </thead>
                      <tbody className="font-mono text-xs">
                        {ir?.metadata.targetEntities.includes('pet') || goal.toLowerCase().includes('pet') ? (
                          <>
                            <RuntimeTableRow id="ssus" name="amissio" status="SOLD" />
                            <RuntimeTableRow id="tio" name="absens" status="SOLD" />
                            <RuntimeTableRow id="i" name="absque" status="PENDING" />
                            <RuntimeTableRow id="neo" name="canto" status="SOLD" />
                            <RuntimeTableRow id="p" name="convoco" status="AVAILABLE" />
                          </>
                        ) : (
                          <>
                            <RuntimeTableRow id="0xFA" name="REL_ALPHA" status="PENDING" />
                            <RuntimeTableRow id="0xFB" name="REL_BETA" status="STABLE" />
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
               </div>

               <button 
                onClick={() => {
                  alert("Mission execution successful.");
                  updateTab('INGEST');
                }}
                className="w-full bg-zinc-900 text-white font-black py-6 uppercase text-sm tracking-[0.3em] shadow-[8px_8px_0px_#ccc] hover:shadow-none translate-y-0 hover:translate-x-[4px] hover:translate-y-[4px] transition-all"
               >
                 ACKNOWLEDGE & PROCEED
               </button>
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <div className="brutal-card border-red-500 bg-red-50 p-4 flex items-center gap-4">
            <AlertCircle className="text-red-500" />
            <div className="flex-1">
               <div className="text-[10px] font-mono font-bold text-red-500 uppercase tracking-widest">COMPILE_ERROR</div>
               <div className="text-xs text-red-500 font-bold">{error}</div>
            </div>
            {error.includes('Quota') && (
              <button 
                onClick={handleCompile}
                className="brutal-button bg-red-500 hover:bg-red-600 text-[9px] py-2 px-4 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
              >
                RETRY
              </button>
            )}
          </div>
        )}

        {/* Notification Toast */}
        <AnimatePresence>
          {notification && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="fixed bottom-14 right-6 z-50 bg-black text-white px-4 py-3 border-2 border-white shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] flex items-center gap-3 font-mono text-xs font-bold"
            >
              <Check size={16} className="text-emerald-400" />
              <span>{notification}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Saved Micro-Apps (jdCards) Modal */}
        <AnimatePresence>
          {showSavedModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white text-black border-4 border-black p-6 w-full max-w-2xl shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] space-y-6 max-h-[85vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b-2 border-black pb-3">
                  <div className="flex items-center gap-2">
                    <FolderOpen size={20} className="text-amber-500" />
                    <h3 className="font-serif text-2xl italic font-bold">Compiled micro-apps (jdCards)</h3>
                  </div>
                  <button 
                    onClick={() => setShowSavedModal(false)}
                    className="p-1 border-2 border-black bg-zinc-100 hover:bg-zinc-200"
                  >
                    <X size={18} />
                  </button>
                </div>

                {savedCards.length === 0 ? (
                  <div className="p-12 border-2 border-dashed border-zinc-300 text-center space-y-2">
                    <Layers size={32} className="mx-auto text-zinc-300" />
                    <p className="text-xs font-mono font-bold text-zinc-400 uppercase tracking-widest">
                      No saved micro-apps found in LocalStorage.
                    </p>
                    <p className="text-[11px] text-zinc-500">
                      Compile an OpenAPI goal in Stage 03 and click 'Save to Library'.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {savedCards.map(card => (
                      <div key={card.id} className="border-2 border-black p-4 bg-zinc-50 space-y-3 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="text-[9px] font-mono font-bold text-amber-600 uppercase tracking-widest">
                              ID: {card.id} • {new Date(card.metadata.compiledAt).toLocaleString()}
                            </div>
                            <h4 className="font-bold text-base">{card.metadata.title}</h4>
                            <p className="text-xs text-zinc-600 font-mono mt-0.5">
                              Intent: "{card.contracts.inboundIntent}"
                            </p>
                          </div>
                          <button 
                            onClick={() => {
                              deleteSavedCard(card.id);
                              triggerNotification("Deleted micro-app from library.");
                            }}
                            className="text-red-500 p-1.5 border border-red-200 hover:border-black hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-zinc-200">
                          <span className="text-[9px] font-mono bg-zinc-200 px-2 py-0.5 font-bold uppercase">
                            Nodes: {Object.keys(card.executionGraph).length}
                          </span>

                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => {
                                downloadJdCardJson(card);
                                triggerNotification(`Downloaded ${card.id}.json`);
                              }}
                              className="border-2 border-black bg-white px-2.5 py-1 text-[10px] font-mono font-bold uppercase hover:bg-zinc-100"
                            >
                              JSON
                            </button>
                            <button 
                              onClick={() => {
                                downloadReactBundle(card);
                                triggerNotification(`Exported ${card.id} React Bundle`);
                              }}
                              className="border-2 border-black bg-brutal-blue text-white px-2.5 py-1 text-[10px] font-mono font-bold uppercase hover:bg-blue-700"
                            >
                              React .TSX
                            </button>
                            <button 
                              onClick={() => {
                                loadSavedCard(card);
                                setShowSavedModal(false);
                                updateTab('INTENT');
                                triggerNotification(`Loaded "${card.metadata.title}" into workspace`);
                              }}
                              className="border-2 border-black bg-amber-400 text-black px-3 py-1 text-[10px] font-mono font-bold uppercase hover:bg-amber-300"
                            >
                              LOAD WORKSPACE
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex justify-end pt-2 border-t-2 border-black">
                  <button 
                    onClick={() => setShowSavedModal(false)}
                    className="border-2 border-black px-6 py-2 bg-zinc-900 text-white font-mono text-xs font-bold uppercase"
                  >
                    CLOSE
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Mobile Sticky Footer Simulation */}
      <footer className="h-10 border-t border-zinc-200 bg-white flex items-center justify-between px-6 text-[9px] font-mono font-bold text-zinc-400 fixed bottom-0 left-0 right-0 z-50">
         <div className="flex items-center gap-4">
           <span>STDOUT: IDLE</span>
           <span>MEM: 12.4MB</span>
         </div>
         <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span>CONNECTED</span>
         </div>
      </footer>
    </div>
  );
}

function PipelineNavItem({ id, label, active, onClick, disabled }: { id: string, label: string, active: boolean, onClick: () => void, disabled?: boolean }) {
  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center gap-2 pb-3 transition-all relative ${active ? 'opacity-100' : 'opacity-40 hover:opacity-60'} ${disabled ? 'cursor-not-allowed grayscale pointer-events-none' : ''}`}
    >
      <span className="text-[10px] font-mono font-bold text-zinc-400">{id}</span>
      <span className={`text-[11px] font-bold tracking-wider ${active ? 'text-black' : 'text-zinc-500'}`}>{label}</span>
      {active && (
        <motion.div 
          layoutId="pipeline-active"
          className="absolute bottom-0 left-0 right-0 h-1 bg-brutal-blue"
        />
      )}
    </button>
  );
}

function StatRow({ label, value }: { label: string, value: string }) {
  return (
    <div className="flex justify-between items-center border-b border-zinc-100 py-1">
      <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">{label}</span>
      <span className="font-mono text-sm font-bold">{value}</span>
    </div>
  );
}

function SuggestChip({ label, onClick }: { label: string, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="px-3 py-1.5 border-2 border-black bg-white hover:bg-zinc-100 transition-colors text-[9px] font-bold font-mono tracking-widest"
    >
      {label}
    </button>
  );
}

function TestResult({ label, status }: { label: string; status: 'OK' | 'ERR' }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-black border-dashed last:border-0">
      <div className="flex items-center gap-3">
        <div className={`w-2 h-2 ${status === 'OK' ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
        <span className="text-[10px] font-mono font-bold tracking-tighter">{label}</span>
      </div>
      <span className={`text-[10px] font-mono font-black ${status === 'OK' ? 'text-emerald-500' : 'text-red-500'}`}>[{status}]</span>
    </div>
  );
}

function RuntimeTableRow({ id, name, status }: { id: string, name: string, status: string }) {
  return (
    <tr className="border-b-2 border-zinc-100 last:border-0 hover:bg-zinc-50 transition-colors">
      <td className="p-4 px-6 text-[10px] text-zinc-400 font-mono">{id.toUpperCase()}</td>
      <td className="p-4 px-6 font-black uppercase text-[11px] tracking-tight">{name}</td>
      <td className="p-4 px-6">
        <span className={`px-3 py-1 border-2 border-black text-[9px] font-black uppercase shadow-[1px_1px_0px_black] ${
          status === 'SOLD' ? 'bg-zinc-100' : 
          status === 'PENDING' ? 'bg-blue-100 text-blue-800' :
          'bg-emerald-100 text-emerald-800'
        }`}>
          {status}
        </span>
      </td>
    </tr>
  );
}
