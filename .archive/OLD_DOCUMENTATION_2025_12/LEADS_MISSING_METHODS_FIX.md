# Leads Service - Missing Methods & Constraint Fix

**Status:** ✅ COMPLETE  
**Date:** December 27, 2025  
**Fixes Applied:** 3 major issues resolved

---

## Issues Fixed

### 1. ❌ Missing `autoCalculateLeadScore` Method
**Problem:** Hook was calling `leadsService.autoCalculateLeadScore(id)` but method didn't exist

**Solution:** Implemented method in `leadsService.ts`:
```typescript
async autoCalculateLeadScore(id: string): Promise<LeadDTO>
```

**Functionality:**
- Fetches current lead
- Calculates score based on engagement metrics:
  - Contact info (email, phone): +10 points each
  - Engagement signals (contact/follow-up): +15 points each
  - Stage progression: +20-50 points
  - Qualification status: +25 points
- Caps score at 100
- Updates lead with new score

---

### 2. ❌ Missing `autoAssignLead` Method
**Problem:** Hook was calling `leadsService.autoAssignLead(id)` but method didn't exist

**Solution:** Implemented method in `leadsService.ts`:
```typescript
async autoAssignLead(id: string): Promise<LeadDTO>
```

**Functionality:**
- Checks if lead is already assigned (skips if yes)
- Fetches all active agents in tenant
- Queries lead count per agent (round-robin load balancing)
- Assigns lead to agent with least assignments
- Returns updated lead with assignment

---

### 3. ❌ Missing `bulkAutoAssignLeads` Method
**Problem:** Hook was calling `leadsService.bulkAutoAssignLeads(ids)` but method didn't exist

**Solution:** Implemented method in `leadsService.ts`:
```typescript
async bulkAutoAssignLeads(ids: string[]): Promise<LeadDTO[]>
```

**Functionality:**
- Loops through array of lead IDs
- Calls `autoAssignLead()` for each
- Continues on individual failures (doesn't break)
- Returns array of successfully assigned leads
- Logs success/failure metrics

---

### 4. ❌ Status Constraint Violation
**Problem:** Update was failing with `check constraint "check_lead_status" violated`

**Root Cause:** Database schema files had outdated constraint that didn't include 'cancelled' status

**Solution:** Updated constraints in:
- `supabase/complete_database_schema.sql` (line 8009)
- `supabase/COMPLETE_DATABASE_EXPORT.sql` (line 8461)

**From:**
```sql
CONSTRAINT check_lead_status CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'))
```

**To:**
```sql
CONSTRAINT check_lead_status CHECK (status IN ('new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'cancelled'))
```

---

## Files Modified

| File | Changes |
|------|---------|
| `src/services/deals/supabase/leadsService.ts` | Added 3 new methods (autoCalculateLeadScore, autoAssignLead, bulkAutoAssignLeads) |
| `supabase/complete_database_schema.sql` | Updated status constraint to include 'cancelled' |
| `supabase/COMPLETE_DATABASE_EXPORT.sql` | Updated status constraint to include 'cancelled' |

---

## Method Details

### autoCalculateLeadScore(id: string)
```typescript
/**
 * Calculates lead score based on:
 * - Contact methods (email, phone)
 * - Engagement signals (contact history, follow-ups)
 * - Sales stage progression
 * - Qualification status
 * 
 * Returns: Updated LeadDTO with new leadScore (0-100)
 */
```

**Score Breakdown:**
- Email provided: +10
- Phone/Mobile provided: +10
- Last contact recorded: +15
- Next follow-up scheduled: +15
- Stage = Interest: +20
- Stage = Consideration: +20
- Stage = Intent: +20
- Stage = Evaluation: +30
- Stage = Purchase: +50
- Qualified status: +25
- Maximum: 100

---

### autoAssignLead(id: string)
```typescript
/**
 * Assigns an unassigned lead to least-loaded agent
 * 
 * Logic:
 * 1. Skip if already assigned
 * 2. Get all active agents in tenant
 * 3. Query lead count per agent (load balancing)
 * 4. Assign to agent with minimum leads
 * 5. Update and return lead
 * 
 * Returns: Updated LeadDTO with assignedTo set
 */
```

**Assignment Strategy:**
- Round-robin load balancing (fewest assignments per agent)
- Only assigns to agents with 'active' status
- Skips if lead already assigned
- Throws if no agents available

---

### bulkAutoAssignLeads(ids: string[])
```typescript
/**
 * Bulk assign multiple leads
 * 
 * Logic:
 * 1. Loop through array of lead IDs
 * 2. Call autoAssignLead() for each
 * 3. Continue on failures (don't break)
 * 4. Return array of successful assignments
 * 
 * Returns: LeadDTO[] of successfully assigned leads
 */
```

**Error Handling:**
- Catches and logs individual errors
- Continues processing remaining leads
- Doesn't throw on individual failures
- Returns count of successful/failed in logs

---

## Integration Points

### useAutoCalculateLeadScore Hook
```typescript
const { mutate } = useAutoCalculateLeadScore();
mutate(leadId);
```

### useAutoAssignLead Hook
```typescript
const { mutate } = useAutoAssignLead();
mutate(leadId);
```

### useBulkAutoAssignLeads Hook
```typescript
const { mutate } = useBulkAutoAssignLeads();
mutate([leadId1, leadId2, leadId3]);
```

---

## Testing Checklist

- [ ] Create new lead - verify leadScore calculated
- [ ] Auto-assign lead - verify assigned to least-loaded agent
- [ ] Bulk assign multiple leads - verify all assigned correctly
- [ ] Lead with 'cancelled' status - verify no constraint errors
- [ ] Update lead status to 'cancelled' - verify succeeds
- [ ] Load test with multiple agents - verify round-robin distribution

---

## Backward Compatibility

✅ **Fully Compatible**
- New methods optional (not called by default)
- Status constraint includes old values + new 'cancelled'
- Existing leads unaffected
- No breaking changes

---

## Console Logs

Look for these logs to verify functionality:

```
[LeadsService] Auto-calculated lead score: { id, oldScore, newScore }
[LeadsService] Auto-assigning lead: { leadId, assignToId, agentLoad }
[LeadsService] Bulk auto-assigned leads: { requested, successful }
```

---

**Status:** READY FOR TESTING ✅

All missing methods implemented, constraints updated, and integrations complete.

