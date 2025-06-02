# 🧪 PRD to Task List Flow
Series of prompts to take a feature request or new project and craete ar PRD and Task list that an AI assistant can use as an implementation plan.

## 🤔 Core Process
1.  **Defining Scope:** Clearly outlining what needs to be built with a Product Requirement Document (PRD).
2.  **Detailed Planning:** Breaking down the PRD into a granular, actionable task list.
3.  **Iterative Implementation:** Guiding the AI to tackle one task at a time, allowing you to review and approve each change.

This structured approach helps ensure the AI stays on track, makes it easier to debug issues, and gives you confidence in the generated code.

## 💻 Workflow

### 1. 📁 Copy the `.mdc` files
Make sure all the `.mdc` files are copied to a directory within your project so you can *at* reference them in your AI chat window.

### 2. 💡 PRD (Product Requirement Doc) Creation
*at* reference the `1-create-prd.mdc` file like so:  

```
Use @1-create-prd.mdc
I would like to build the following:
===
[Describe your feature in detail]
===
These files might be helpful as a reference: @inventory.md, @code-standards.md, @file-xyz.md ⇠ OPTIONAL
```

*(Tip: Use a Thinking model if available)*


### 3. ⚙️ Generate Your Task List from the PRD
This step will use the previously created PRD (e.g., `prd-[feature-name].md`) to generate a detailed, step-by-step implementation plan for your AI Agent to follow.
*at* reference the `2-generate-tasks-from-prd.mdc` file like so:  

```
Create tasks from @prd-[feature-name].md by following @2-generate-tasks-from-prd.mdc
```

You should now have a well-structured implementation plan in the form of a Task List for your AI agent to follow.


### 4. ✨ Work through the Tasks
*at* reference `3-process-task-list.mdc` like so to start working on the tasks:

```
Follow the instruction in @3-process-task-list.mdc to start working on the next uncomplete task (example: [ ] 1.1) in @tasks-[prd-file-name].md
```
*(Note: You typically only need to reference `@3-process-task-list.mdc` for the *first* task in a "new chat"; The instructions within it will guide the AI for subsequent tasks.)*

The AI will attempt the task and then prompt you to review.

### 5. 👁️ Review & Approve
As the AI completes each task, you review the changes.
*   If the changes are good, simply reply with "yes" (or a similar affirmative) to instruct the AI to mark the task complete and move to the next one.
*   If changes are needed, provide feedback to the AI to correct the current task before moving on.

---

Original idea:
https://github.com/snarktank/ai-dev-tasks

YouTube video demo:
https://www.youtube.com/watch?v=fD4ktSkNCw4
