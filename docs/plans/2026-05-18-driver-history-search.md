# Driver Trip History Search Option Implementation Plan

> **For Antigravity:** REQUIRED WORKFLOW: Use `.agent/workflows/execute-plan.md` to execute this plan in single-flow mode.

**Goal:** Add a modern, debounced search option to the Driver Trip History page, enabling drivers to search past trips by passenger name/phone and pickup/destination addresses.

**Architecture:** 
1. Extract search query building logic into a pure, testable backend helper function `buildDriverHistoryWhere` in a new file `lib/history.ts`.
2. Write unit tests for this query builder using Jest to follow strict TDD.
3. Integrate the query builder in the backend GET route (`app/api/driver/history/route.ts`).
4. Update the frontend (`app/driver/history/page.tsx`) by adding the debounced Search Input component and updating API state synchronization.

**Tech Stack:** Next.js, React Hooks, Prisma, Jest, Lucide Icons

---

### Task 1: Create backend query builder helper and unit tests

**Files:**
- Create: `lib/history.ts`
- Create: `tests/driver-history-search.test.ts`

**Step 1: Write the failing test**

We will write `tests/driver-history-search.test.ts` to test `buildDriverHistoryWhere` which does not exist yet.

```typescript
import { buildDriverHistoryWhere } from "@/lib/history";

describe("buildDriverHistoryWhere", () => {
  it("should build base where clause with status, timeframe, and driverId", () => {
    const driverId = "test-driver-id";
    const result = buildDriverHistoryWhere(driverId, {
      status: "COMPLETED",
      timeframe: "all",
      search: "",
    });

    expect(result.driverId).toBe(driverId);
    expect(result.status).toBe("COMPLETED");
    expect(result.OR).toBeUndefined();
  });

  it("should build nested OR search fields when search parameter is provided", () => {
    const result = buildDriverHistoryWhere("test-driver-id", {
      status: "COMPLETED",
      timeframe: "all",
      search: "Rahim",
    });

    expect(result.OR).toBeDefined();
    expect(result.OR).toHaveLength(3);
    expect(result.OR).toContainEqual({ pickupAddress: { contains: "Rahim", mode: "insensitive" } });
    expect(result.OR).toContainEqual({ destAddress: { contains: "Rahim", mode: "insensitive" } });
    expect(result.OR).toContainEqual({
      user: {
        OR: [
          { name: { contains: "Rahim", mode: "insensitive" } },
          { phone: { contains: "Rahim", mode: "insensitive" } },
        ],
      },
    });
  });
});
```

**Step 2: Run test to verify it fails**

Run: `yarn jest tests/driver-history-search.test.ts`
Expected: FAIL (Cannot find module `@/lib/history` or `buildDriverHistoryWhere` is not defined)

**Step 3: Write minimal implementation**

Create `lib/history.ts`:

```typescript
import { Prisma } from "@prisma/client";
import { BookingStatus } from "@/lib/types/booking";

interface SearchParams {
  status?: string | null;
  timeframe?: string | null;
  search?: string | null;
}

export function buildDriverHistoryWhere(driverId: string, params: SearchParams): Prisma.BookingWhereInput {
  const { status, timeframe, search } = params;
  
  const whereClause: Prisma.BookingWhereInput = {
    driverId,
    status: status ? (status as BookingStatus) : { in: ["COMPLETED", "CANCELLED"] as BookingStatus[] },
  };

  if (timeframe && timeframe !== "all") {
    const now = new Date();
    const start = new Date(now);
    if (timeframe === "today") {
      start.setHours(0, 0, 0, 0);
    } else if (timeframe === "weekly") {
      start.setDate(now.getDate() - 7);
    } else if (timeframe === "monthly") {
      start.setDate(now.getDate() - 30);
    }
    whereClause.createdAt = { gte: start };
  }

  if (search && search.trim()) {
    const query = search.trim();
    whereClause.OR = [
      { pickupAddress: { contains: query, mode: "insensitive" } },
      { destAddress: { contains: query, mode: "insensitive" } },
      {
        user: {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } }
          ]
        }
      }
    ];
  }

  return whereClause;
}
```

**Step 4: Run test to verify it passes**

Run: `yarn jest tests/driver-history-search.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add lib/history.ts tests/driver-history-search.test.ts
git commit -m "feat(backend): add history query builder helper and unit tests"
```

---

### Task 2: Integrate query builder into backend API

**Files:**
- Modify: `app/api/driver/history/route.ts`

**Step 1: Write test case to mock and check endpoint input parameters**

Add a test case in `tests/driver-history-search.test.ts` to verify timeframe handling or query builder limits.

**Step 2: Run test to verify it fails**

(Not applicable as we are refactoring existing route, but we will run standard tests to verify nothing broke).

**Step 3: Modify app/api/driver/history/route.ts to use buildDriverHistoryWhere**

```typescript
import { buildDriverHistoryWhere } from "@/lib/history";
```

Replace lines 23-39 in `app/api/driver/history/route.ts` with:
```typescript
    const search = searchParams.get("search");
    const whereClause = buildDriverHistoryWhere(session.sub, {
      status,
      timeframe,
      search,
    });
```

**Step 4: Verify Jest tests pass**

Run: `yarn jest tests/driver-history-search.test.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add app/api/driver/history/route.ts
git commit -m "feat(backend): integrate buildDriverHistoryWhere into history route"
```

---

### Task 3: Implement Debounced Search UI in Frontend

**Files:**
- Modify: `app/driver/history/page.tsx`

**Step 1: Locate existing state and view rendering**

Locate state values in `app/driver/history/page.tsx` (around lines 212-247).

**Step 2: Modify frontend file to add search input and debounced logic**

Add the search state, loading indicator state, debounce effect, and the beautiful search input container.

State & Debounce:
```typescript
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
```

Effect for debouncing:
```typescript
  // Debounce search query
  useEffect(() => {
    if (searchQuery.trim()) {
      setIsSearching(true);
    }
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setIsSearching(false);
    }, 400);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);
```

Update dependencies in history fetcher:
Add `debouncedSearchQuery` to the dependency array and append `search` parameter if it exists:
```typescript
    const query = new URLSearchParams({
      page: page.toString(),
      limit: "10",
      timeframe,
    });
    if (statusFilter !== "ALL") query.append("status", statusFilter);
    if (debouncedSearchQuery.trim()) query.append("search", debouncedSearchQuery.trim());
```
(Be sure to add `debouncedSearchQuery` to the `useEffect` trigger dependencies, and reset page to `1` when `debouncedSearchQuery` changes).

UI render:
Import `Search`, `X` from `"lucide-react"`.
Render the beautiful text field above the filter pills but below the stats grid:
```typescript
            {/* Search Input */}
            <div className="relative w-full">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-slate-400" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setPage(1);
                  setSearchQuery(e.target.value);
                }}
                placeholder={t("search_placeholder")}
                className="block w-full pl-9 pr-10 py-2 border border-slate-200 rounded-2xl bg-white text-xs font-bold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all shadow-sm"
              />
              {isSearching && (
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <div className="animate-spin rounded-full h-3 w-3 border-2 border-primary border-t-transparent" />
                </div>
              )}
              {!isSearching && searchQuery && (
                <button
                  onClick={() => {
                    setPage(1);
                    setSearchQuery("");
                  }}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center hover:text-slate-600 text-slate-400"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
```

**Step 3: Run the build to verify TypeScript and lint**

Run: `yarn build`
Expected: PASS

**Step 4: Commit**

```bash
git add app/driver/history/page.tsx
git commit -m "feat(frontend): implement beautiful debounced search bar"
```
