# 🔧 MAINTENANCE RUNBOOK - PDS-CRM Architecture

**Project**: PDS-CRM Application  
**Version**: 1.0 (February 2025)  
**Status**: ✅ Production Ready  
**Audience**: DevOps, Tech Leads, Senior Developers

---

## 📋 TABLE OF CONTENTS

1. [Daily Pre-Commit Checks](#daily-pre-commit-checks)
2. [Weekly Health Checks](#weekly-health-checks)
3. [Per-Release Procedures](#per-release-procedures)
4. [Responding to ESLint Violations](#responding-to-eslint-violations)
5. [Emergency Procedures](#emergency-procedures)
6. [Rollback Procedures](#rollback-procedures)
7. [Monitoring & Alerting](#monitoring--alerting)
8. [Support & Escalation](#support--escalation)

---

## ⏰ DAILY PRE-COMMIT CHECKS

### For Each Developer Before Committing

**Time Required**: 2-3 minutes per commit

#### Step 1: Lint Check
```bash
npm run lint
```

**Expected Result**: ✅ 0 errors (only pre-existing @typescript-eslint/no-explicit-any warnings allowed)

**If Error**: 
- [ ] Read error message carefully
- [ ] Check: Is it an architecture rule violation?
- [ ] See: DEVELOPER_GUIDE_IMPORT_PATTERNS.md or IMPORT_PATTERNS_QUICK_GUIDE.md
- [ ] Fix the code
- [ ] Re-run lint until clean
- [ ] Commit only after lint passes

---

#### Step 2: TypeScript Check
```bash
npx tsc --noEmit
```

**Expected Result**: ✅ 0 errors

**If Error**:
- [ ] Check error message
- [ ] Is it a type import issue? → Fix import path
- [ ] Is it a circular dependency? → Refactor imports
- [ ] Cannot fix? → Escalate to Tech Lead

---

#### Step 3: Build Check
```bash
npm run build
```

**Expected Result**: ✅ Build succeeds (typically 50-70 seconds)

**If Error**:
- [ ] Check build output for specific errors
- [ ] Typical causes: Unused imports, missing files
- [ ] Fix issues and retry
- [ ] If still failing: Do not commit - escalate

---

#### Step 4: Manual Review (Self-Review)

Before requesting code review:

- [ ] **Imports Check**
  - [ ] All services from `@/services/serviceFactory`
  - [ ] All types from `@/types`
  - [ ] No @/modules/* type imports
  
- [ ] **Files Check**
  - [ ] No new circular imports introduced
  - [ ] Service files only import from @/types
  - [ ] Module files use factory pattern
  
- [ ] **Formatting**
  - [ ] Code is readable
  - [ ] Comments explain complex logic
  - [ ] No dead code

---

### Pre-Commit Checklist Template

Use this before each commit:

```markdown
## Pre-Commit Verification
- [ ] `npm run lint` passes (0 errors)
- [ ] `npx tsc --noEmit` passes (0 errors)
- [ ] `npm run build` succeeds
- [ ] Services imported from factory
- [ ] Types imported from @/types
- [ ] No circular dependencies
- [ ] Self-review complete
- [ ] Ready for code review
```

---

## 📊 WEEKLY HEALTH CHECKS

### Every Friday (15 min)

#### Task 1: Full Build Verification
```bash
# Clean build
rm -rf node_modules dist
npm install
npm run build
```

**Expected**: ✅ Clean install, build succeeds

**If Fails**:
- [ ] Check for new dependencies with issues
- [ ] Verify node version matches team standard
- [ ] Run `npm audit` for security issues
- [ ] Report to Tech Lead if unexpected

---

#### Task 2: Lint Against Entire Codebase
```bash
npm run lint
```

**Expected**: ✅ 0 architecture-related violations

**If Violations Found**:
- [ ] Identify which files have violations
- [ ] Are they new violations?
- [ ] Create issue ticket for violation fixes
- [ ] Schedule cleanup sprint

---

#### Task 3: Dependency Check
```bash
npm outdated
npm audit
```

**Expected**: ✅ No critical vulnerabilities

**If Issues Found**:
- [ ] Review advisory details
- [ ] Test updates in staging first
- [ ] Update if safe, otherwise document risk
- [ ] Report security issues immediately

---

#### Task 4: Mode Testing
```bash
# Test mock mode
VITE_API_MODE=mock npm run dev
# Manually test: load page, verify data displays

# Test Supabase mode  
VITE_API_MODE=supabase npm run dev
# Manually test: load page, verify real data displays
```

**Expected**: ✅ Both modes work, data displays correctly

**If Issues**:
- [ ] Check .env configuration
- [ ] Verify environment variables set correctly
- [ ] Test specific modules that changed that week
- [ ] Report failures in team sync

---

#### Task 5: Review New Violations
```bash
# Check for recent violations in last week's code
git log --oneline -n 20 | head -10
# Spot check any files that might have issues
npm run lint -- src/modules/*/services/*.ts
```

**Expected**: ✅ No new violations

**If Found**:
- [ ] Notify developers immediately
- [ ] Create quick PR to fix
- [ ] Review ESLint rule understanding
- [ ] Conduct mini-training if needed

---

### Weekly Checklist

```markdown
## Weekly Health Check (Friday)
- [ ] Full build succeeds
- [ ] `npm run lint`: 0 violations
- [ ] `npm audit`: no critical issues
- [ ] Mock mode works
- [ ] Supabase mode works
- [ ] No new violations detected
- [ ] Team notified of any issues
```

---

## 🚀 PER-RELEASE PROCEDURES

### Pre-Release (1-2 days before release)

#### 1. Verify All Checks Pass
```bash
npm run lint && npm run build && npx tsc --noEmit
```

**Expected**: ✅ All pass

---

#### 2. Test Both Modes Thoroughly
```bash
# Create temporary .env.local
cp .env .env.local

# Test mock mode
VITE_API_MODE=mock npm run dev
# Execute:
#   - Login
#   - Create record
#   - Edit record
#   - Delete record
#   - List views load
#   - Search works

# Test Supabase mode
VITE_API_MODE=supabase npm run dev
# Execute:
#   - Same tests as mock mode
#   - Verify real data loads
#   - Check multi-tenant isolation
```

---

#### 3. Run Full Test Suite
```bash
npm run test
npm run test:e2e  # if available
```

**Expected**: ✅ All tests pass

---

#### 4. Final Build Verification
```bash
npm run build
```

**Expected**: ✅ Production build succeeds, no warnings

---

#### 5. Performance Check
```bash
# Use Chrome DevTools or Lighthouse
# Check:
#   - Page load time
#   - No excessive console errors
#   - No memory leaks
#   - Network requests reasonable
```

---

#### 6. Changelog Preparation
- [ ] Document all new features
- [ ] Document all fixes
- [ ] Document breaking changes (if any)
- [ ] Update VERSION file
- [ ] Prepare release notes

---

### Release Day

#### 1. Final Pre-Flight Check
```bash
npm run lint && npm run build
```

#### 2. Tag Release
```bash
git tag -a v1.x.x -m "Release v1.x.x"
git push origin v1.x.x
```

#### 3. Deploy to Production
- [ ] Follow deployment pipeline
- [ ] Monitor for errors
- [ ] Check error tracking (Sentry if available)
- [ ] Verify uptime

#### 4. Post-Deployment Verification
```bash
# Verify production:
#   - App loads
#   - Basic operations work
#   - No obvious errors
#   - Performance acceptable
```

---

### Post-Release

#### 1. Monitor Error Logs
- [ ] Check for new errors
- [ ] Watch production metrics
- [ ] Monitor uptime
- [ ] Track user reports

#### 2. Hotfix Procedure (if needed)
```bash
git checkout main
git pull origin main
git checkout -b hotfix/issue-name
# Make fix
# Test locally
git commit -m "fix: Description"
git push origin hotfix/issue-name
# Create PR, get approval, merge
git tag -a v1.x.x-hotfix.1 -m "Hotfix v1.x.x-hotfix.1"
git push origin v1.x.x-hotfix.1
# Redeploy
```

---

### Release Checklist

```markdown
## Pre-Release Checklist
- [ ] All linting passes
- [ ] All TypeScript checks pass
- [ ] Build succeeds
- [ ] Mock mode tested thoroughly
- [ ] Supabase mode tested thoroughly
- [ ] All tests pass
- [ ] Performance acceptable
- [ ] Changelog prepared
- [ ] VERSION updated
- [ ] Ready to release

## Release Day
- [ ] Final verification run
- [ ] Git tag created
- [ ] Deployed to production
- [ ] Production verification complete
- [ ] Team notified
- [ ] Monitoring set up

## Post-Release  
- [ ] Error logs monitored
- [ ] User reports tracked
- [ ] Performance metrics reviewed
- [ ] Hotfix procedure if needed
```

---

## ⚠️ RESPONDING TO ESLINT VIOLATIONS

### When ESLint Rule Violations Occur

#### For Single Violations

**Step 1: Identify the Rule**
```bash
npm run lint
# Look for which rule was violated:
# - no-direct-service-imports
# - no-service-module-imports
# - type-import-location
```

**Step 2: Understand the Rule**
- See: IMPORT_PATTERNS_QUICK_GUIDE.md (Troubleshooting section)
- See: DEVELOPER_GUIDE_IMPORT_PATTERNS.md (Common Mistakes section)

**Step 3: Fix the Code**
Follow the guide to fix the violation

**Step 4: Verify**
```bash
npm run lint -- src/specific/file.tsx
```

**Step 5: Commit**
```bash
git add .
git commit -m "fix: resolve import pattern violation in filename"
```

---

#### For Multiple Violations (Audit)

**Step 1: Identify All Violations**
```bash
npm run lint > lint-violations.txt
# Count violations by type
grep "no-direct-service-imports" lint-violations.txt | wc -l
grep "no-service-module-imports" lint-violations.txt | wc -l
grep "type-import-location" lint-violations.txt | wc -l
```

**Step 2: Categorize by Severity**
- **Critical**: Violations in production code
- **High**: Violations in shared utilities
- **Medium**: Violations in modules
- **Low**: Violations in tests

**Step 3: Create Tickets**
For each group, create a GitHub issue:
```
Title: Fix [N] violations in [category]
Labels: bug, architecture, technical-debt
Priority: Based on severity
Description: 
- Violation type: [rule name]
- Affected files: [list]
- Expected fix time: [estimate]
```

**Step 4: Schedule Fixes**
- [ ] Critical: Fix immediately
- [ ] High: Fix within current sprint
- [ ] Medium: Fix within 2 sprints
- [ ] Low: Fix in maintenance window

**Step 5: Track Progress**
Monitor fixes via GitHub issues, update status regularly

---

#### For Build Failures from Violations

**Emergency Response** (if violations break the build):

```bash
# Step 1: Identify breaking violation
npm run build 2>&1 | grep -i "error"

# Step 2: Find the file
# Use: grep command or search in error message

# Step 3: Quick fix
# Use: DEVELOPER_GUIDE_IMPORT_PATTERNS.md for solution

# Step 4: Verify fix
npm run build

# Step 5: Commit
git commit -m "emergency fix: resolve build-breaking violation"

# Step 6: Escalate
# Contact Tech Lead if you're unsure
```

---

### ESLint Violation Response Matrix

| Violation Type | Severity | Action | Timeline |
|---|---|---|---|
| Direct service import | 🔴 Critical | Fix immediately | Now |
| Service-module import | 🔴 Critical | Fix immediately | Now |
| Wrong type location | 🟡 High | Fix in current PR | Before merge |
| Multiple violations | 🟡 High | Create audit ticket | 1 sprint |

---

## 🆘 EMERGENCY PROCEDURES

### Build Failure

**Immediate Response** (5 minutes):

```bash
# 1. Identify the issue
npm run build

# 2. Check recent commits
git log --oneline -n 5

# 3. If recent commit caused it, revert
git revert <commit-hash>

# 4. If not obvious, run diagnostics
npm run lint
npx tsc --noEmit

# 5. Communicate to team
# Post in Slack: @team BUILD FAILED [reason]
```

---

### Production Error

**Immediate Response** (10 minutes):

```bash
# 1. Assess impact
#    - Which users affected?
#    - Which modules broken?
#    - Is data affected?

# 2. Determine if rollback needed
#    - If corrupting data: YES, rollback immediately
#    - If UI broken: Maybe, try hotfix first
#    - If minor issue: Monitor, create hotfix

# 3. If rolling back
git revert <release-commit-hash>
npm run build
# Deploy rollback version
# Notify users

# 4. If creating hotfix
git checkout -b hotfix/issue-name
# Make minimal fix
# Test thoroughly
# Deploy
```

---

### Circular Dependency Detected

**Response**:

```bash
# 1. Identify circular dependency
npm run lint

# 2. Understand the cycle
# See: DEVELOPER_GUIDE_IMPORT_PATTERNS.md

# 3. Possible solutions:
#    a) Move shared code to @/types
#    b) Use service factory instead of direct import
#    c) Restructure module organization

# 4. Implement fix
# 5. Verify with: npm run build && npm run lint
# 6. Create PR for fix
```

---

### Mass Import Violations

**Response** (if many violations suddenly appear):

```bash
# 1. Check for automation/generation issues
git log --oneline -n 10
# Was there a code generator or tool run?

# 2. If tool-caused:
git revert <tool-commit>
npm run lint  # should return to clean state

# 3. If manual changes caused:
# Contact developers to fix their PRs
# Create tickets for each violator

# 4. If source unknown:
# Check specific file changes
# Review git diff to understand what happened

# 5. Prevent recurrence
# Add pre-commit hook if not already
# Review process with team
```

---

### Cannot Resolve Module

**Response**:

```bash
# 1. Error: Cannot find module '@/modules/...'
# Likely cause: Wrong import path

# 2. Check file exists
ls -la src/modules/feature-name/file.ts

# 3. Check path alias in tsconfig.json
grep "@/" tsconfig.json

# 4. Common fixes:
#    - Case sensitivity: src/Modules vs src/modules
#    - Missing /index.ts file
#    - Wrong path alias

# 5. Verify:
npx tsc --noEmit

# 6. If still failing, check DEVELOPER_GUIDE_IMPORT_PATTERNS.md
```

---

## 🔄 ROLLBACK PROCEDURES

### Rollback to Previous Release

**When to Rollback**:
- Data corruption detected
- Critical functionality broken
- System unavailable
- Performance degradation (50%+)

**NOT a reason to rollback**:
- Minor bugs (create hotfix instead)
- UI issues (create hotfix)
- Typos (create hotfix)

---

### Step-by-Step Rollback

**Step 1: Notify Team**
```
@channel ROLLBACK IN PROGRESS
Issue: [description]
Rolling back from v1.x.x to v1.x.(x-1)
ETA: [estimate]
```

**Step 2: Identify Previous Release**
```bash
git tag -l | grep v1 | sort -V | tail -5
# Shows last 5 releases
```

**Step 3: Checkout Previous Version**
```bash
git checkout v1.x.(x-1)
```

**Step 4: Verify Build**
```bash
npm install
npm run build
npx tsc --noEmit
```

**Expected**: ✅ Clean build

**Step 5: Deploy**
```bash
# Follow deployment pipeline with rollback commit
# Monitor deployment logs
# Verify production comes back online
```

**Step 6: Verify Services**
```bash
# Test:
# - App loads
# - Core features work
# - Data intact
# - Performance normal
```

**Step 7: Notify Completion**
```
ROLLBACK COMPLETE
System restored to v1.x.(x-1)
Previous data: PRESERVED
Cause analysis: In progress
Next steps: Post-mortem review scheduled
```

---

### Post-Rollback Analysis

**Within 24 hours**:

1. **Root Cause Analysis**
   - [ ] What exactly failed?
   - [ ] Why did it pass tests?
   - [ ] How should we prevent this?

2. **Create Incident Ticket**
   ```
   Title: Post-Mortem: v1.x.x Rollback
   Include:
   - Timeline of events
   - Root cause
   - Contributing factors
   - Preventive measures
   ```

3. **Implement Preventive Measures**
   - [ ] Add specific test?
   - [ ] Add monitoring?
   - [ ] Change process?
   - [ ] Additional training?

4. **Plan Rerelease**
   - [ ] Fix issue
   - [ ] Add test/monitoring
   - [ ] Full QA cycle
   - [ ] Release when ready

---

### Rollback Checklist

```markdown
## Rollback Procedure
- [ ] Issue identified and confirmed
- [ ] Team notified
- [ ] Previous release identified
- [ ] Previous version checked out
- [ ] Build succeeds
- [ ] Deployment executed
- [ ] Services verified working
- [ ] Team notified of completion
- [ ] Post-mortem scheduled
- [ ] Root cause analysis started
```

---

## 📡 MONITORING & ALERTING

### Set Up Monitoring

**For Production**:

1. **Error Tracking** (e.g., Sentry)
   - [ ] ESLint violations caught
   - [ ] Runtime errors tracked
   - [ ] Performance issues identified
   - [ ] Alert when threshold exceeded

2. **Build Pipeline**
   - [ ] Build failure alerts
   - [ ] Lint violation alerts
   - [ ] Type error alerts
   - [ ] Test failure alerts

3. **Application Monitoring**
   - [ ] Page load time
   - [ ] API response time
   - [ ] Error rate
   - [ ] User sessions

---

### Alert Thresholds

| Metric | Threshold | Action |
|--------|-----------|--------|
| Build Failures | 2 in 24h | Investigate |
| ESLint Violations | 1 new | Fix before merge |
| TypeScript Errors | 1 new | Fix before merge |
| Production Errors | 10 in 5min | Page down alert |
| Response Time | >5s avg | Investigate performance |
| Error Rate | >1% | Investigate |

---

### Daily Monitoring Routine

```bash
# 1. Check error logs
# Dashboard: [Sentry URL]
# Filter: Last 24 hours
# Action: Review new errors, assign if needed

# 2. Check build status
# Dashboard: [GitHub Actions URL]
# Action: Verify no failing builds

# 3. Check performance
# Dashboard: [APM tool URL]
# Action: Verify metrics in acceptable range

# 4. Check user feedback
# Channels: Slack, email, support tickets
# Action: Track any reported issues
```

---

## 📞 SUPPORT & ESCALATION

### Support Channels

**Level 1: Self-Help** (Try first)
- DEVELOPER_GUIDE_IMPORT_PATTERNS.md
- CODE_REVIEW_CHECKLIST_IMPORTS.md
- IMPORT_PATTERNS_QUICK_GUIDE.md

**Level 2: Team Help**
- Post in #architecture Slack channel
- Mention code snippet and error
- Tag @architecture-champions

**Level 3: Tech Lead**
- Direct message @tech-lead
- Include: error description, code, attempted fixes
- Response time: Within 1 hour

**Level 4: Emergency Escalation**
- Page on-call DevOps: `incident-channel`
- Include: severity, impact, steps to reproduce
- Response time: Immediate

---

### Escalation Criteria

| Issue | Response Time | Escalation |
|-------|---|---|
| Build failing | 30 min | Tech Lead |
| Production down | 5 min | On-call DevOps |
| Data loss | 5 min | Manager + On-call DevOps |
| Security issue | 15 min | Security Lead + Tech Lead |
| Performance <50% | 30 min | Tech Lead |

---

### Communication Template

**Use this when reporting issues**:

```markdown
## Issue Report

**Issue**: [Brief description]

**Severity**: [Critical/High/Medium/Low]

**Impact**: [Who/what affected]

**Steps to Reproduce**:
1. [First step]
2. [Second step]
3. [...]

**Error Message**:
```
[Paste full error]
```

**Attempted Fixes**:
- [ ] [Fix attempt 1]
- [ ] [Fix attempt 2]

**Environment**:
- Node version: [X.X.X]
- npm version: [X.X.X]
- VITE_API_MODE: [mock/supabase]

**Additional Context**:
[Any other relevant information]
```

---

## ✅ MAINTENANCE SIGN-OFF

**Monthly Maintenance Review** (First Friday of month):

```markdown
## Monthly Review - [Month/Year]

### Statistics
- Total commits: ___
- PRs merged: ___
- ESLint violations fixed: ___
- Build failures: ___
- Production incidents: ___

### Issues Addressed
- [ ] Issue 1
- [ ] Issue 2
- [ ] ...

### Process Improvements
- [ ] Process change 1
- [ ] Process change 2
- [ ] ...

### Next Month Priorities
1. [Priority 1]
2. [Priority 2]
3. [Priority 3]

Reviewed By: _________________
Date: _________________
```

---

**Runbook Version**: 1.0  
**Last Updated**: February 2025  
**Status**: ✅ ACTIVE - Use for all maintenance operations  
**Next Review**: March 2025