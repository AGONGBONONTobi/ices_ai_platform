import { ToolConfig, toolSchema, ToolInput } from "../schema/tool-schema";

export class ToolBuilder {
  private config: Partial<ToolConfig> = { inputs: [] };

  constructor(id: string) {
    this.config.id = id;
  }

  setTitle(title: string): this {
    this.config.title = title;
    return this;
  }

  setCategory(category: string): this {
    this.config.category = category;
    return this;
  }

  addInput(input: ToolInput): this {
    this.config.inputs?.push(input);
    return this;
  }

  setPromptTemplate(template: string): this {
    this.config.promptTemplate = template;
    return this;
  }

  setOutputSchema(schema: Record<string, any>): this {
    this.config.outputSchema = schema;
    return this;
  }

  build(): ToolConfig {
    const result = toolSchema.safeParse(this.config);
    if (!result.success) {
      throw new Error(`Invalid tool configuration: ${result.error.message}`);
    }
    return result.data;
  }
}
