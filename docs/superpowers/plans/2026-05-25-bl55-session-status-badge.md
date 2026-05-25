# BL-55 Session Status Badge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Display the session `status` field as a read-only MUI Chip badge in the sessions list and session detail page.

**Architecture:** Three targeted edits — extend the `SessionType` TS type, add a Status column to `SessionsTable`, and add a status Chip to the session detail card. No new files needed. Follows the existing `urlStatus` chip pattern already used in `AssessmentResourcesTable`.

---

## File Map

**Modify:**
- `src/types/app/assessmentTypes.ts` — add `status` field to `SessionType`
- `src/views/assessments/SessionsTable.tsx` — add Status column with Chip
- `src/app/(dashboard)/assessments/[id]/sessions/[sessionId]/page.tsx` — add status Chip to detail card

---

## Task 0: Create feature branch

- [ ] **Step 1: Create branch from develop**

```bash
git checkout develop && git pull
git checkout -b feature/BL-55-session-status-badge
```

Expected: switched to new branch.

---

## Task 1: Add `status` to `SessionType`

**Files:**
- Modify: `src/types/app/assessmentTypes.ts:7`

- [ ] **Step 1: Update `SessionType`**

Replace line 7:
```typescript
export type SessionType = { id: number; assessmentId: number; startTime: string }
```
With:
```typescript
export type SessionType = { id: number; assessmentId: number; startTime: string; status?: 'ACTIVE' | 'COMPLETE' | null }
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/types/app/assessmentTypes.ts
git commit -m "[BL-55] Add status field to SessionType"
```

---

## Task 2: Add Status column to `SessionsTable`

**Files:**
- Modify: `src/views/assessments/SessionsTable.tsx`

- [ ] **Step 1: Add `Chip` import**

At the top of the file, after the existing MUI imports, add:
```typescript
import Chip from '@mui/material/Chip'
```

- [ ] **Step 2: Add Status column to the `columns` array**

Insert after the `startTime` accessor and before the `actions` column:
```typescript
columnHelper.accessor('status', {
  header: 'Status',
  cell: ({ row }) => {
    const status = row.original.status
    if (!status) return null
    const color = status === 'ACTIVE' ? 'success' : 'default'
    return <Chip label={status} color={color} size='small' variant='tonal' />
  }
}),
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/views/assessments/SessionsTable.tsx
git commit -m "[BL-55] Add status chip column to SessionsTable"
```

---

## Task 3: Add status Chip to session detail page

**Files:**
- Modify: `src/app/(dashboard)/assessments/[id]/sessions/[sessionId]/page.tsx`

- [ ] **Step 1: Add `Chip` import**

Add after the existing MUI imports at the top:
```typescript
import Chip from '@mui/material/Chip'
```

- [ ] **Step 2: Render status Chip in the detail card**

In `SessionDetailPage`, find the `<CardContent>` block (lines 67–72):
```tsx
<CardContent className='flex flex-col gap-2'>
  <Typography variant='h5'>Session #{session.id}</Typography>
  <Typography color='text.secondary'>Start Time: {session.startTime}</Typography>
  <Typography color='text.secondary'>Assessment: #{session.assessmentId}</Typography>
</CardContent>
```

Replace with:
```tsx
<CardContent className='flex flex-col gap-2'>
  <div className='flex items-center gap-3'>
    <Typography variant='h5'>Session #{session.id}</Typography>
    {session.status && (
      <Chip
        label={session.status}
        color={session.status === 'ACTIVE' ? 'success' : 'default'}
        size='small'
        variant='tonal'
      />
    )}
  </div>
  <Typography color='text.secondary'>Start Time: {session.startTime}</Typography>
  <Typography color='text.secondary'>Assessment: #{session.assessmentId}</Typography>
</CardContent>
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```
Expected: no errors

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/assessments/[id]/sessions/[sessionId]/page.tsx
git commit -m "[BL-55] Add status chip to session detail page"
```

---

## Task 4: Verify and create PR

- [ ] **Step 1: Run dev server and verify visually**

```bash
npm run dev
```

Open `http://localhost:3000/assessments` and confirm:
- Sessions table has a Status column
- Sessions with `ACTIVE` show a green chip, `COMPLETE` a grey chip, `null` show nothing

Open a session detail page and confirm the chip appears inline with the session title.

- [ ] **Step 2: Create PR targeting `develop`**

```bash
gh pr create \
  --title "[BL-55] Display session status badge" \
  --body "Displays the session status field as a read-only MUI Chip badge in the sessions list and session detail page. Follows the existing urlStatus chip pattern. No start/stop controls (future BL-52)." \
  --base develop
```

- [ ] **Step 3: Update Notion ticket**

Set the **Inlementation** property on BL-55 to the PR URL. Set status to **In Review**.
