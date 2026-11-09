type Row = { id: number };
type Request = { version: number; cursor: number | null };

export function mergeById<T extends Row>(previous: T[], incoming: T[]): T[] {
    return Array.from(
        new Map(
            [...previous, ...incoming].map((row) => [row.id, row]),
        ).values(),
    );
}

// Keep the cursor and lock synchronous: multiple FlatList events can fire
// before React commits a loading state update.
export function createPagination() {
    let version = 0;
    let active = false;
    let ready = false;
    let cursor: number | null = null;
    let hasMore = true;

    return {
        invalidate() {
            version += 1;
            active = false;
            ready = false;
            cursor = null;
            hasMore = true;
        },
        begin(reset: boolean): Request | null {
            if (!reset && (active || !ready || !hasMore)) return null;
            active = true;
            version += 1;
            return { version, cursor: reset ? null : cursor };
        },
        isCurrent(request: Request) {
            return request.version === version;
        },
        accept(request: Request, rows: Row[], pageSize: number) {
            if (request.version !== version) return;
            cursor = rows.length ? rows[rows.length - 1].id : request.cursor;
            hasMore = rows.length === pageSize;
            ready = true;
        },
        finish(request: Request) {
            if (request.version === version) active = false;
        },
    };
}
