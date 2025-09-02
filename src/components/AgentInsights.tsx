import React from "react";

type Segment = {
  departure: { iataCode: string; at: string };
  arrival: { iataCode: string; at: string };
  carrierCode: string;
  numberOfStops?: number;
};

type Itinerary = { duration?: string; segments: Segment[] };

type Offer = {
  id: string;
  price: number;
  currency: string;
  itineraries: Itinerary[];
  highlights?: { stops?: number; carriers?: string[]; depart_at?: string; arrive_at?: string };
  pros?: string[];
  cons?: string[];
};

type AgenticResult = {
  summary?: { count?: number; min?: number; median?: number; max?: number; p25?: number; p75?: number };
  recommendation?: Offer | null;
  top_recommendations?: Offer[];
  explanation?: string | null;
};

interface AgentInsightsProps {
  result: AgenticResult | null;
}

const AgentInsights: React.FC<AgentInsightsProps> = ({ result }) => {
  if (!result) return null;
  const { summary, recommendation, top_recommendations, explanation } = result;

  return (
    <div className="mt-8 space-y-6">
      {summary && (
        <div className="p-4 bg-slate-50 border rounded-lg">
          <div className="font-semibold mb-2">Market summary</div>
          <div className="text-sm text-slate-700">
            <div>Offers: {summary.count ?? 0}</div>
            <div>
              Price range: {summary.min?.toFixed(2)} - {summary.max?.toFixed(2)}{' '}
              {recommendation?.currency || 'USD'} (median {summary.median?.toFixed(2)})
            </div>
          </div>
        </div>
      )}

      {top_recommendations && top_recommendations.length > 0 && (
        <div className="space-y-3">
          <div className="font-semibold">Top recommendations</div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top_recommendations.map((o) => (
              <div key={o.id} className="p-4 border rounded-lg bg-white shadow-sm">
                <div className="flex items-baseline justify-between">
                  <div className="text-lg font-bold">
                    {o.price.toFixed(2)} {o.currency}
                  </div>
                  <div className="text-xs text-slate-500">{o.highlights?.carriers?.join(', ')}</div>
                </div>
                <div className="mt-2 text-sm text-slate-700">
                  <div>Stops: {o.highlights?.stops ?? '-'}</div>
                  <div>
                    Depart: {o.highlights?.depart_at?.replace('T', ' ') ?? '-'}
                  </div>
                  <div>
                    Arrive: {o.highlights?.arrive_at?.replace('T', ' ') ?? '-'}
                  </div>
                </div>
                {(o.pros?.length || o.cons?.length) ? (
                  <div className="mt-3 text-xs">
                    {o.pros && o.pros.length > 0 && (
                      <div className="text-green-700">Pros: {o.pros.join(', ')}</div>
                    )}
                    {o.cons && o.cons.length > 0 && (
                      <div className="text-red-700">Cons: {o.cons.join(', ')}</div>
                    )}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {explanation && (
        <div className="p-4 bg-emerald-50 border rounded-lg">
          <div className="font-semibold mb-1">Why this recommendation?</div>
          <div className="text-sm whitespace-pre-wrap text-emerald-900">{explanation}</div>
        </div>
      )}
    </div>
  );
};

export default AgentInsights;


