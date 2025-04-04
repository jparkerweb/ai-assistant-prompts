# Example Setup for a collection of `.cursor/rules`

## Files
- Copy the `.cursor/rules` to the root of your project.
- The  `behavior` file is geared toward a basic web stack (modify as needed, but keep the doc update instructions). It is always included when submitting any prompt.
- The `memory-bank.mdc` file is always included and used to server as persistent memory for the agent.
- The `mode` rules will be included by the agent when trigger by:
  - "enter PLANNING MODE"
  - "enter INVENTORY MODE"
  - "enter SECURITY MODE"

## Common Flow

### New Project
1. In agent window type:  
```
enter PLANNING MODE

I want build XYZ Application
- some details
- some more details
- some even more details
- some final details (dont worry you can add more later)
```

2. The agent will respond with questions and ask for clarification

3. After all questions are answered, the agent will generate an `SOW.md` file in the root of the project

4. Edit the SOW.md file as needed and then type: `update MEMORY BANK`

5. The agent will create the initial files needed for persistent memory

6. At this point you have all the files needed in memory to start your project and you can delete the `SOW.md` file.

7. After the agent has stopped working on changes, ensure your MEMORY BANK is updated. If not type `docs` or `update MEMORY BANK`.

### Existing Projects

If you have an existing project, you can use the same rules. Start by updating the memory bank. You can do this by typing `update MEMORY BANK`.

From there you can create a new `SOW.md` to update your MEMORY BANK from by typing `enter PLANNING MODE`, then follow the same process as a new project, or you can ask for specific changes and skip the planning mode altogether.

## Inventory

It is often helpful to have an inventory of the project. You can do this by typing `enter INVENTORY MODE` to have the agent generate an `INVENTORY.md` file in the root of the project.

## Security

It is important to have a security plan for your project. You can do this by typing `enter SECURITY MODE` to have the agent scan your project for security vulnerabilities and generate a `SECURITY.md` file in the root of the project.
