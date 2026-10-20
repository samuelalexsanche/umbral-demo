"use client";
import { useDB, useSessionUser } from "@/lib/db";
import { relTime } from "@/lib/format";
import { Avatar, Empty } from "@/components/ui";
import { Guard, PageHead } from "@/components/panel/Shell";

export default function Actividad() {
  const db = useDB();
  const me = useSessionUser();
  if (!me) return null;
  const list = db.activity.filter((a) => me.role === "superadmin" || (me.role === "org_admin" ? a.orgId === me.orgId : a.userId === me.id || db.users.find((u) => u.id === a.userId)?.managerId === me.id));
  return (
    <Guard roles={["superadmin", "org_admin", "asesor"]}>
      <PageHead title="Actividad" sub="Bitácora de cambios: quién publicó, editó, revisó o dio de alta a alguien." />
      {list.length === 0 ? <Empty title="Sin actividad todavía" /> : (
        <ol className="grid gap-1 rounded-[14px] border border-line bg-card p-3">
          {list.map((a) => {
            const u = db.users.find((x) => x.id === a.userId);
            return (
              <li key={a.id} className="flex items-center gap-3 rounded-[10px] px-2 py-2.5 text-sm hover:bg-paper">
                <Avatar name={u?.name ?? "?"} size={30} />
                <p className="flex-1"><strong>{u?.name}</strong> <span className="text-ink-2">{a.text}</span></p>
                <span className="shrink-0 text-ink-3">{relTime(a.at)}</span>
              </li>
            );
          })}
        </ol>
      )}
    </Guard>
  );
}
