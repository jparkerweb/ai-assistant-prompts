# 👨‍🏫 cursor-prompts
collection of prompts and `.cursorrules` to use with cursor ai

## Prompts

Prompts are fundamental instructions that you use often to start projects, update functionality, write documentation, etc.

## Global Rules

Global rules are fundamental settings that shape Cursor AI's behavior across all interactions. These rules should be input directly into Cursor's settings to ensure consistent application.

Global rules are used to:
- Set the overall tone and style of interactions
- Define general preferences for code and explanations
- Establish guidelines for problem-solving approaches
- Specify how to handle various scenarios

For a comprehensive list of recommended global rules, refer to the [global-rules.md](global-rules.md) file in this repository. These rules cover aspects such as communication style, code formatting preferences, and general interaction guidelines.

## Cursor Rules

Cursor Rules are project-specific instructions that can be defined in a `.cursorrules` file placed in the root of your project. These rules work in tandem with the global rules set above, allowing you to tailor Cursor AI's behavior for specific projects.

To use Cursor Rules:
1. Create a file named `.cursorrules` in your project's root directory.
2. Add your project-specific instructions to this file.

Cursor will automatically include these instructions for features like Cursor Chat and Ctrl/⌘ K within that project.

This repository includes an example `.cursorrules` files. Each example file is is named after the project type it is for. To use these rules in your project, simply rename them to `.cursorrules` and place it in your project's root directory.

- [.cursorrules-js-html-css-node.md](.cursorrules-js-html-css-node.md): Specific rules and preferences for projects using JavaScript, HTML, CSS, and Node.js. It covers code style, structure, naming conventions, and best practices for these technologies. 

By combining global rules with project-specific Cursor Rules, you can create a highly customized and efficient development environment tailored to your needs and preferences.

