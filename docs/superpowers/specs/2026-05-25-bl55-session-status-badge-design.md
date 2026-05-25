# BL-55 Frontend: Session Status Badge

## Goal

Display the `status` field returned by the backend on all session endpoints as a read-only badge. No start/stop controls — that's a future ticket (BL-52).

## API Contract

All session endpoints now return:

```typescript
type SessionType = {
  id: number
  assessmentId: number
  startTime: string
  status?: 'ACTIVE' | 'COMPLETE' | null  // null = not yet started
}
```

## Changes

### 1. Type update — `src/types/app/assessmentTypes.ts`

Add `status?: 'ACTIVE' | 'COMPLETE' | null` to `SessionType`.

### 2. Sessions list — `src/views/assessments/SessionsTable.tsx`

Add a **Status** column after `startTime`. Render using MUI `<Chip size='small' variant='tonal'>` following the existing `urlStatus` pattern in `AssessmentResourcesTable.tsx`:

| Value      | Chip color  |
|------------|-------------|
| `ACTIVE`   | `success`   |
| `COMPLETE` | `default`   |
| `null`/missing | no chip |

### 3. Session detail — `src/app/(dashboard)/assessments/[id]/sessions/[sessionId]/page.tsx`

Add the same Chip in the session detail card, inline with the session title.

## Out of Scope

- `AddSessionDrawer` and `EditSessionDrawer`: no `status` field — not user-editable.
- Start/stop buttons: future ticket BL-52.
