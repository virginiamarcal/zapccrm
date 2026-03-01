# Git Worktree Guide — Parallel Development

## What is a Worktree?

Isolated git working directories allowing parallel development on different branches without switching contexts.

**Benefits:**
- Work on multiple features simultaneously
- Different branch per worktree
- No branch switching delays
- Independent node_modules, build artifacts

## Wave 2 Worktrees

### Epic 1 Implementation (for @dev)
```bash
# Location
.claude/worktrees/epic-1

# Branch
epic-1-implementation (tracks master)

# Status
✅ Created and ready for development

# To switch to this worktree
cd .claude/worktrees/epic-1

# Pull latest changes
git pull origin master

# Create local feature branch
git checkout -b feature/user-auth
```

## Usage Workflow

### 1. Development in Worktree
```bash
cd .claude/worktrees/epic-1

# Make changes
npm run dev

# Test locally
npm test

# Commit work
git add .
git commit -m "feat: implement user authentication [Story 1.1]"
```

### 2. Push to Remote
```bash
# Push feature branch
git push origin feature/user-auth

# Create PR
gh pr create --base epic-1-implementation \
  --title "feat: user auth" \
  --body "Implements Story 1.1"
```

### 3. Merge Back to Main
```bash
# Switch to main
cd /c/Users/Samsung/zapccrm

# Verify feature works
git pull

# Merge worktree branch
git merge epic-1-implementation

# Push to main
git push origin master
```

## Managing Worktrees

### List all worktrees
```bash
git worktree list
```

### Remove a worktree (after merging)
```bash
git worktree remove .claude/worktrees/epic-1
```

### Cleanup stale worktrees (>30 days)
```bash
@devops *cleanup-worktrees
```

### Create new worktree for another epic
```bash
git worktree add --track -b epic-2-implementation \
  .claude/worktrees/epic-2 master
```

## Best Practices

✅ **DO:**
- Create one worktree per epic/feature
- Keep worktree branch sync'd with main
- Commit atomic, focused changes
- Test before pushing

❌ **DON'T:**
- Work on master in worktree (always create feature branch)
- Merge back without testing
- Leave stale worktrees (cleanup regularly)
- Push directly to master (use PRs)

## Workflow for Wave 2

1. @dev works in `.claude/worktrees/epic-1` on Epic 1 stories
2. Each story = separate feature branch
3. Test locally before push
4. Create PR to epic-1-implementation
5. @qa reviews in isolation
6. Merge to master once approved

---

**Current Status:** Epic 1 worktree ready for @dev

Created: 2026-03-01 by @devops (Gage)
