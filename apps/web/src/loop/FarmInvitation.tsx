export function FarmInvitation({ reason, busy, onInvite }: { reason: string | null; busy?: boolean; onInvite: () => void }) {
  return <section className="flex min-h-11 items-center justify-between gap-1.5 rounded-md border border-hairline bg-sunken px-1.5"
    aria-label="Farm invitation available" data-farm-invitation>
    <div className="min-w-0">
      <p className="text-[13px] font-semibold">Farm invitation</p>
      {reason && <p className="truncate text-[11px] text-ink-soft" title={reason}>{reason}</p>}
    </div>
    <button type="button" disabled={busy || reason !== null} onClick={onInvite}
      className="min-h-11 shrink-0 rounded-md px-2 text-[13px] font-semibold text-accent-strong disabled:text-ink-faint"
      data-action="invite-work">Invite · 1</button>
  </section>
}
