import { formatMonthFromParts, formatNumber } from "@/lib/utils";

type Row = {
  year: number;
  month: number;
  electricityKwh: number;
  waterM3: number;
  wasteKg: number;
  recyclingKg: number;
  businessTravelKm: number;
  commutingKm: number;
  totalEmissions: number;
};

export function DataTable({ rows }: { rows: Row[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-slate-500">
            <th className="pb-3 pr-4 font-medium">Month</th>
            <th className="pb-3 pr-4 font-medium">Electricity</th>
            <th className="pb-3 pr-4 font-medium">Water</th>
            <th className="pb-3 pr-4 font-medium">Waste</th>
            <th className="pb-3 pr-4 font-medium">Recycling</th>
            <th className="pb-3 pr-4 font-medium">Travel</th>
            <th className="pb-3 pr-4 font-medium">Commuting</th>
            <th className="pb-3 font-medium">Total emissions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.year}-${row.month}`} className="border-b border-slate-100 text-slate-700">
              <td className="py-3 pr-4 font-medium text-ink">
                {formatMonthFromParts(row.year, row.month)}
              </td>
              <td className="py-3 pr-4">{formatNumber(row.electricityKwh)} kWh</td>
              <td className="py-3 pr-4">{formatNumber(row.waterM3)} m3</td>
              <td className="py-3 pr-4">{formatNumber(row.wasteKg)} kg</td>
              <td className="py-3 pr-4">{formatNumber(row.recyclingKg)} kg</td>
              <td className="py-3 pr-4">{formatNumber(row.businessTravelKm)} km</td>
              <td className="py-3 pr-4">{formatNumber(row.commutingKm)} km</td>
              <td className="py-3 font-medium text-ink">
                {formatNumber(row.totalEmissions)} kg CO2e
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
