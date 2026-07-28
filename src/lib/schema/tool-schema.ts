import { z } from "zod";

// Une option de select peut être soit une string simple soit {label, score}
export const toolSelectOptionSchema = z.union([
  z.string(),
  z.object({
    label: z.string(),
    score: z.number().optional(),
  }),
]);

export const toolInputSchema = z.object({
  name: z.string().min(1, "Input name is required"),
  type: z.enum(["text", "textarea", "number", "select"]),
  // Support des deux formats : string[] (ancien) ou {label, score}[] (nouveau)
  options: z.array(toolSelectOptionSchema).optional(),
  label: z.string().optional(),
  question: z.string().optional(), // Nouveau champ : la question factuelle
  placeholder: z.string().optional(),
  required: z.boolean().default(true),
});

/**
 * Nature du livrable produit par l'outil. Détermine le schéma de sortie, les
 * consignes envoyées au modèle et le mode de rendu (interface et PDF).
 *
 * `profile` mesure des dimensions (personnalité, style d'apprentissage) : on y
 * parle d'intensité, jamais de score, et le rendu n'applique aucun code couleur
 * de valeur.
 */
export const outputKinds = [
  "assessment",
  "analysis",
  "document",
  "table",
  "profile",
] as const;

export type OutputKind = (typeof outputKinds)[number];

export const DEFAULT_OUTPUT_KIND: OutputKind = "analysis";

export const toolSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  category: z.string().min(1),
  inputs: z.array(toolInputSchema),
  promptTemplate: z.string().min(1),
  outputSchema: z.record(z.string(), z.any()),
  // Absent des fiches antérieures au typage des sorties : on retombe sur le défaut.
  output_kind: z.enum(outputKinds).default(DEFAULT_OUTPUT_KIND),
});

export type ToolSelectOption = z.infer<typeof toolSelectOptionSchema>;
export type ToolInput = z.infer<typeof toolInputSchema>;
export type ToolConfig = z.infer<typeof toolSchema>;
