// Hardcoded prompting tips data for the library page
export const promptingTipsData = [
  {
    id: "specificity-matters",
    type: "prompting-tip" as const,
    title: "Be Specific and Detailed",
    description: "Learn why specificity is crucial when crafting AI prompts",
    category: "GENERAL",
    difficulty: "beginner" as const,
    estimatedTime: 3,
    tags: ["fundamentals", "specificity", "clarity"],
    content: {
      sections: [
        {
          title: "Why Specificity Matters",
          content: "AI models work best when given clear, detailed instructions. Vague prompts lead to unpredictable results. The more specific you are about what you want, the better the AI can understand and deliver your vision.",
          example: "Instead of: 'Draw a house'\n\nTry: 'Create a photorealistic image of a charming two-story Victorian house with a wraparound porch, painted in soft blue with white trim, surrounded by a white picket fence and blooming rose bushes, during golden hour with warm sunlight casting long shadows.'"
        },
        {
          title: "Key Elements to Include",
          content: "Subject, style, lighting, colors, composition, mood, and technical details all help the AI create exactly what you're envisioning. Don't assume the AI knows your preferences - explicitly state them."
        }
      ]
    }
  },
  {
    id: "context-is-key",
    type: "prompting-tip" as const,
    title: "Provide Context and Examples",
    description: "Use context and examples to guide AI behavior",
    category: "GENERAL",
    difficulty: "beginner" as const,
    estimatedTime: 4,
    tags: ["context", "examples", "guidance"],
    content: {
      sections: [
        {
          title: "The Power of Context",
          content: "Context helps AI understand the broader situation and purpose of your request. It prevents the AI from making assumptions that don't align with your goals.",
          example: "Context: 'I'm creating a marketing campaign for a luxury watch brand targeting professionals aged 35-50.'\n\nPrompt: 'Write a compelling product description for our new limited-edition chronograph watch with ceramic case and automatic movement.'"
        },
        {
          title: "Reference Examples",
          content: "When possible, provide examples of what you like or don't like. This gives the AI a clear reference point and helps it understand your preferences and style."
        }
      ]
    }
  },
  {
    id: "iterative-refinement",
    type: "prompting-tip" as const,
    title: "Iterate and Refine",
    description: "How to improve results through iterative prompting",
    category: "GENERAL",
    difficulty: "intermediate" as const,
    estimatedTime: 5,
    tags: ["iteration", "refinement", "improvement"],
    content: {
      sections: [
        {
          title: "Start Broad, Then Refine",
          content: "Begin with a general prompt to get initial results, then use follow-up prompts to refine specific aspects. This iterative approach often yields better final results than trying to get everything perfect in one prompt.",
          example: "First prompt: 'Create a logo for a coffee shop'\n\nRefinement: 'Make the coffee cup more prominent, change the background to warm brown, and use a serif font for the shop name'"
        },
        {
          title: "Give Specific Feedback",
          content: "When refining, be specific about what you want to change and why. Instead of 'make it better,' say 'increase the contrast by 20% to make the text more readable.'"
        }
      ]
    }
  },
  {
    id: "image-generation-tips",
    type: "prompting-tip" as const,
    title: "Image Generation Best Practices",
    description: "Specific tips for creating compelling AI-generated images",
    category: "IMAGE GENERATION",
    difficulty: "intermediate" as const,
    estimatedTime: 6,
    tags: ["image", "visual", "composition", "style"],
    content: {
      sections: [
        {
          title: "Master Composition",
          content: "Think like a photographer or artist. Consider the rule of thirds, leading lines, focal points, and how elements interact within the frame.",
          example: "Use leading lines: 'A winding forest path leading to a mysterious cabin, with trees framing the composition on both sides, golden hour lighting casting long shadows along the path.'"
        },
        {
          title: "Specify Art Styles",
          content: "Different art styles produce dramatically different results. Be specific about the artistic approach you want - photorealistic, cartoon, watercolor, digital art, etc.",
          example: "Style specification: 'in the style of Studio Ghibli animation, with soft watercolor backgrounds and detailed character expressions'"
        },
        {
          title: "Lighting and Mood",
          content: "Lighting dramatically affects the mood and atmosphere of your image. Specify time of day, weather conditions, and lighting quality.",
          example: "Lighting mastery: 'dramatic chiaroscuro lighting with strong shadows, backlit subject creating a silhouette effect, moody and atmospheric'"
        }
      ]
    }
  },
  {
    id: "coding-prompt-structure",
    type: "prompting-tip" as const,
    title: "Effective Coding Prompts",
    description: "How to write prompts that generate better code",
    category: "CODING",
    difficulty: "intermediate" as const,
    estimatedTime: 5,
    tags: ["coding", "programming", "structure", "best-practices"],
    content: {
      sections: [
        {
          title: "Define Requirements Clearly",
          content: "Start with a clear problem statement, then specify inputs, outputs, constraints, and edge cases. Good code prompts read like technical specifications.",
          example: "Problem: Create a function that validates email addresses\n\nRequirements:\n- Input: string\n- Output: boolean\n- Handle edge cases: multiple @ symbols, special characters\n- Follow RFC 5322 standards\n- Include unit tests"
        },
        {
          title: "Specify Language and Framework",
          content: "Always specify the programming language, framework, and version. Include coding standards, naming conventions, and architectural patterns you want followed.",
          example: "Language specification: 'Write a React component in TypeScript using functional components with hooks, following Airbnb style guide, with proper TypeScript interfaces'"
        },
        {
          title: "Request Explanations",
          content: "Ask for comments and explanations within the code to understand the logic and make future modifications easier.",
          example: "Include explanations: 'Add detailed comments explaining the algorithm logic and any complex business rules implemented in the code'"
        }
      ]
    }
  },
  {
    id: "copywriting-formulas",
    type: "prompting-tip" as const,
    title: "Copywriting Prompt Strategies",
    description: "Craft prompts that generate persuasive, engaging copy",
    category: "COPYWRITING",
    difficulty: "intermediate" as const,
    estimatedTime: 5,
    tags: ["copywriting", "persuasion", "marketing", "communication"],
    content: {
      sections: [
        {
          title: "Define Your Audience",
          content: "The most effective copy speaks directly to a specific audience. Define demographics, psychographics, pain points, and motivations.",
          example: "Audience definition: 'Write for busy professionals aged 30-45 who value efficiency and status symbols, concerned about work-life balance, motivated by career advancement'"
        },
        {
          title: "Structure with Frameworks",
          content: "Use proven copywriting frameworks like AIDA (Attention, Interest, Desire, Action) or PAS (Problem, Agitate, Solution) to guide the AI.",
          example: "Framework usage: 'Use the PAS formula to write a product description: first identify the problem, then amplify the pain, finally present our solution as the ideal fix'"
        },
        {
          title: "Include Emotional Triggers",
          content: "Effective copy connects emotionally. Specify the emotions you want to evoke - trust, excitement, fear of missing out, aspiration, etc.",
          example: "Emotional connection: 'Create a sense of urgency and exclusivity, making the reader feel like they're part of an elite group of early adopters who get to experience something special before everyone else'"
        }
      ]
    }
  }
];