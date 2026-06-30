import { create } from "zustand";
import { NCG, IntentGraph, WorkflowPlan, IRGraph, GoalRefinement } from "./types";
import { ingestOpenApi } from "./lib/compiler/ingestor";
import { planWorkflow, buildIR } from "./lib/compiler/planner";

interface StudioState {
  ncg: NCG | null;
  intent: IntentGraph | null;
  plan: WorkflowPlan | null;
  ir: IRGraph | null;
  goal: string;
  refinement: GoalRefinement | null;
  model: string;
  isCompiling: boolean;
  isRefining: boolean;
  error: string | null;

  // Visual Diff/Drift detection
  sourceSpec: string;
  compiledNcg: NCG | null;

  // Intent compilation staging
  stagingIntent: IntentGraph | null;
  hasConfirmedIntent: boolean;

  // Actions
  setGoal: (goal: string) => void;
  ingestSpec: (content: string) => void;
  refineGoal: () => Promise<void>;
  applyRefinedGoal: (goal: string) => void;
  setModel: (model: string) => void;
  compile: () => Promise<void>;
  finalizeIntent: () => void;
  updateStagingParameter: (actionId: string, paramName: string, value: string) => void;
  syncCompiledNcg: () => void;
  reset: () => void;
}

export const useStudioStore = create<StudioState>((set, get) => ({
  ncg: null,
  intent: null,
  plan: null,
  ir: null,
  goal: "",
  refinement: null,
  model: "gemini-3.5-flash",
  isCompiling: false,
  isRefining: false,
  error: null,

  sourceSpec: "",
  compiledNcg: null,
  stagingIntent: null,
  hasConfirmedIntent: false,

  setGoal: (goal) => set({ goal }),

  setModel: (model) => set({ model }),

  ingestSpec: (content) => {
    try {
      const ncg = ingestOpenApi(content);
      const { compiledNcg } = get();
      set({ 
        ncg, 
        sourceSpec: content, 
        compiledNcg: compiledNcg ? compiledNcg : ncg, 
        error: null 
      });
    } catch (e: any) {
      set({ error: "Failed to ingest OpenAPI spec: " + e.message });
    }
  },

  refineGoal: async () => {
    const { goal, ncg, model } = get();
    if (!goal || !ncg) {
      set({ error: "Goal and API spec are required" });
      return;
    }

    set({ isRefining: true, error: null });

    try {
      const response = await fetch("/api/compiler/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, ncg, model }),
      });

      if (!response.ok) throw new Error("Failed to refine goal");
      const refinement: GoalRefinement = await response.json();
      set({ refinement, isRefining: false });
    } catch (e: any) {
      set({ error: "Refinement failed: " + e.message, isRefining: false });
    }
  },

  applyRefinedGoal: (goal) => {
    set({ goal, refinement: null });
  },

  compile: async () => {
    const { goal, ncg, model } = get();
    if (!goal || !ncg) {
      set({ error: "Goal and API spec are required" });
      return;
    }

    set({ isCompiling: true, error: null, stagingIntent: null, hasConfirmedIntent: false });

    try {
      // 1. Get Intent from API
      const response = await fetch("/api/compiler/intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal, ncg, model }),
      });

      if (!response.ok) throw new Error("Failed to compile intent");
      const stagingIntent: IntentGraph = await response.json();

      set({ stagingIntent, isCompiling: false });
    } catch (e: any) {
      set({ error: "Compilation failed: " + e.message, isCompiling: false });
    }
  },

  finalizeIntent: () => {
    const { stagingIntent, ncg, goal } = get();
    if (!stagingIntent || !ncg) {
      set({ error: "Staging intent and NCG are required to finalize" });
      return;
    }

    // 2. Plan Deterministically
    const plan = planWorkflow(stagingIntent, ncg);

    // 3. Build IR
    const ir = buildIR(plan, ncg, goal, stagingIntent);

    set({ 
      intent: stagingIntent, 
      plan, 
      ir, 
      compiledNcg: ncg, // Synchronize the baseline compiled schema upon finalization
      hasConfirmedIntent: true 
    });
  },

  updateStagingParameter: (actionId, paramName, value) => {
    const { stagingIntent } = get();
    if (!stagingIntent) return;

    const updatedParams = stagingIntent.parameters?.map(p => {
      if (p.actionId === actionId && p.paramName === paramName) {
        return { ...p, suggestedValue: value };
      }
      return p;
    }) || [];

    set({
      stagingIntent: {
        ...stagingIntent,
        parameters: updatedParams
      }
    });
  },

  syncCompiledNcg: () => {
    const { ncg } = get();
    if (ncg) {
      set({ compiledNcg: ncg });
    }
  },

  reset: () => set({ 
    ncg: null, 
    intent: null, 
    plan: null, 
    ir: null, 
    goal: "", 
    error: null, 
    stagingIntent: null, 
    hasConfirmedIntent: false 
  })
}));
