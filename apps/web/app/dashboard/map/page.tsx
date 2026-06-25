import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Map, Sparkles } from "lucide-react";

export const metadata = {
  title: "Map View · Atlas Ops",
  description: "Live geospatial map of all field technicians and job sites.",
};

export default function MapViewPage() {
  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8 h-full flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-200/60 mx-auto mb-5">
            <Map className="h-8 w-8 text-sky-500" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Map View</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            A live geospatial map showing all field technician locations,
            job sites, and real-time routing across your operations area.
          </p>
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-sm font-medium text-sky-600">
            <Sparkles className="h-3.5 w-3.5" />
            Feature Coming Soon
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
