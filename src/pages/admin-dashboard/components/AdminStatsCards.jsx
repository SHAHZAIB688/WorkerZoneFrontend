import { IconWrapper } from "../../../components/icons";

const AdminStatsCards = ({ items }) => (
  <section>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {items.map((item) => (
        <article key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <IconWrapper>
              <item.icon />
            </IconWrapper>
            <div>
              <p className="text-2xl font-bold text-cyan-700">{item.value}</p>
              <p className="text-xs text-slate-600">{item.label}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  </section>
);

export default AdminStatsCards;
