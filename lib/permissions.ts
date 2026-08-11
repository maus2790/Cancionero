export type ContentUser = { id: number; role?: string | null; provider?: string | null };

export function canCreateContent(user: ContentUser | null | undefined) {
    return !!user && user.provider !== 'guest' && (user.role === 'admin' || user.role === 'creator');
}

export function canManageContent(user: ContentUser | null | undefined, ownerId: number | null) {
    return !!user && user.provider !== 'guest' && (user.role === 'admin' || (user.role === 'creator' && user.id === ownerId));
}
